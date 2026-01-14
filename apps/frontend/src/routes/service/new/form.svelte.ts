import { api } from "$lib/api";
import { ServiceService } from "$lib/services/service.service";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";

export class ServiceFormStore {
    // Service Type
    isWalkin = $state(false);
    currentStep = $state(1);
    isSubmitting = $state(false);

    // Step 1: Customer Data
    customerName = $state("");
    customerPhone = $state("");
    customerAddress = $state("");

    // Step 2: Device Data
    phoneBrand = $state("");
    phoneModel = $state("");
    phoneStatus = $state("nyala");
    imei = $state("");
    pinPattern = $state("");
    physicalConditions = $state<string[]>([]);
    completeness = $state<string[]>([]);
    physicalNotes = $state("");

    // Pattern Lock
    isPatternOpen = $state(false);
    patternPoints = $state<number[]>([]);
    patternString = $derived(
        this.patternPoints.length > 0
            ? this.patternPoints.map((p) => p + 1).join("-")
            : ""
    );

    // Step 3: Service Details
    complaint = $state("");
    technician = $state("");
    estimatedCompletionDate = $state("");

    // Regular service specific
    initialDiagnosis = $state("");
    possibleCauses = $state("");
    isPriceRange = $state(false);
    estimatedCost = $state(0);
    minPrice = $state(0);
    maxPrice = $state(0);
    downPayment = $state(0);

    // Walk-in specific
    serviceFee = $state(0);
    serviceDescription = $state("");
    sparepartSource = $state("none");
    selectedParts = $state<any[]>([]);
    extPartName = $state("");
    extPartBuyPrice = $state(0);

    // Common
    photos = $state<string[]>([]);
    isUploading = $state(false);

    // Computed
    step1Valid = $derived(
        this.customerName.trim() !== "" && (this.isWalkin || this.customerPhone.trim() !== "")
    );

    step2Valid = $derived(
        this.phoneBrand.trim() !== "" && this.phoneModel.trim() !== ""
    );

    totalPartPrice = $derived(
        this.selectedParts.reduce(
            (sum, p) => sum + (parseInt(p.sellPrice) || 0),
            0
        ) + (this.sparepartSource === "external" ? this.extPartBuyPrice || 0 : 0)
    );

    grandTotal = $derived((this.serviceFee || 0));
    walkinServiceFee = $derived(this.grandTotal - this.totalPartPrice);

    step3Valid = $derived(
        this.complaint.trim() !== "" &&
        (!this.isWalkin || (this.technician !== "" && !!this.serviceFee))
    );

    // Methods
    nextStep() {
        if (this.currentStep === 1 && !this.step1Valid) {
            toast.error(
                this.isWalkin
                    ? "Harap isi nama customer"
                    : "Harap isi nama dan nomor telepon customer"
            );
            return;
        }
        if (this.currentStep === 2 && !this.step2Valid) {
            toast.error("Harap isi brand dan model handphone");
            return;
        }
        if (this.currentStep === 3 && !this.step3Valid) {
            if (this.isWalkin) {
                if (this.technician === "") {
                    toast.error("Teknisi wajib dipilih untuk Walk-in Service");
                } else if (!this.serviceFee) {
                    toast.error("Total biaya wajib diisi untuk Walk-in Service");
                } else if (this.serviceFee < this.totalPartPrice) {
                    toast.error("Total biaya tidak boleh kurang dari harga sparepart");
                } else {
                    toast.error("Harap isi kerusakan");
                }
            } else {
                toast.error("Harap isi keluhan customer");
            }
            return;
        }
        this.currentStep++;
    }

    prevStep() {
        this.currentStep--;
    }

    async handleFileUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        this.isUploading = true;
        const files = Array.from(input.files);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await api.post("/uploads", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                const data = res.data;
                if (data.success && data.data.url) {
                    this.photos.push(data.data.url);
                }
            }
            toast.success("Foto berhasil diupload");
        } catch (error) {
            toast.error("Gagal upload foto");
        } finally {
            this.isUploading = false;
            input.value = "";
        }
    }

    removePhoto(index: number) {
        this.photos = this.photos.filter((_, i) => i !== index);
    }

    addInventoryPart(part: any) {
        const sellPrice = part.batches?.[0]?.sellPrice || 0;
        this.selectedParts.push({ ...part, sellPrice, type: "inventory" });
        toast.success(`${part.name} ditambahkan`);
    }

    removePart(index: number) {
        this.selectedParts = this.selectedParts.filter((_, i) => i !== index);
    }

    handlePatternChange(points: number[]) {
        this.patternPoints = points;
        this.pinPattern = "Pola: " + this.patternString;
    }

    async handleSubmit() {
        if (!this.step3Valid) {
            toast.error("Harap lengkapi semua field yang wajib");
            return;
        }

        this.isSubmitting = true;
        try {
            const payload: any = {
                type: this.isWalkin ? "walk_in" : "regular",
                customer: {
                    name: this.customerName,
                    phone: this.customerPhone || undefined,
                    address: this.customerAddress || undefined,
                },
                unit: {
                    brand: this.phoneBrand,
                    model: this.phoneModel,
                    status: this.phoneStatus,
                    imei: this.imei || undefined,
                    pin: this.pinPattern || undefined,
                    condition: this.physicalConditions,
                    completeness: this.completeness,
                    physicalNotes: this.physicalNotes || undefined,
                },
                complaint: this.complaint,
                technicianId: this.technician || null,
                status: this.isWalkin ? "selesai" : "antrian",
                photos: [...this.photos],
                estimatedCompletionDate: this.estimatedCompletionDate
                    ? new Date(this.estimatedCompletionDate).toISOString()
                    : undefined,
            };

            if (!this.isWalkin) {
                payload.diagnosis = {
                    initial: this.initialDiagnosis || undefined,
                    possibleCauses: this.possibleCauses || undefined,
                    estimatedCost: this.isPriceRange
                        ? `${this.minPrice}-${this.maxPrice}`
                        : this.estimatedCost || undefined,
                    downPayment: this.downPayment || undefined,
                };
            }

            if (this.isWalkin) {
                payload.serviceFee = this.walkinServiceFee;
                payload.serviceDescription = this.serviceDescription || undefined;
                if (this.selectedParts.length > 0) {
                    payload.parts = this.selectedParts.map((p) => ({
                        productId: p.id,
                        qty: 1,
                        price: parseInt(p.price),
                    }));
                }
            }

            await ServiceService.create(payload);
            toast.success(
                this.isWalkin
                    ? "Service Walk-in Selesai!"
                    : "Service order berhasil dibuat!"
            );
            goto("/service");
        } catch (e: any) {
            toast.error(
                "Gagal membuat service: " +
                (e.response?.data?.message || e.message)
            );
        } finally {
            this.isSubmitting = false;
        }
    }
}

// Create a singleton instance or context-based? Singleton is fine for page-level state here if we reset it
// But better to instantiate in page and pass via Context
