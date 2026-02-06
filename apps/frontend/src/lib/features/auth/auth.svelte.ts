import { api } from "$lib/shared/core/api";
import { browser } from "$app/environment";

export type User = {
    id: string;
    username: string;
    name: string;
    role?: string | { id: string; name: string };
    roles?: string[]; // Multiple roles support
    email?: string;
};

class AuthStore {
    user = $state<User | null>(null);
    loading = $state(false); // Start false to prevent initial hang
    isAuthenticated = $derived(!!this.user);

    /** Consolidated roles list from user data */
    roles = $derived.by(() => {
        if (!this.user) return [];
        if (this.user.roles && this.user.roles.length > 0) return this.user.roles;

        // Fallback to legacy single role field
        const legacyRole = typeof this.user.role === "object" ? this.user.role.id : this.user.role;
        return legacyRole ? [legacyRole] : [];
    });

    /** Primary role for high-level UI logic and legacy support */
    role = $derived.by(() => {
        if (this.roles.includes('super_admin')) return 'super_admin';
        if (this.roles.includes('owner')) return 'owner';
        if (this.roles.includes('manager')) return 'manager';
        if (this.roles.includes('teknisi')) return 'teknisi';
        if (this.roles.includes('kasir')) return 'kasir';
        if (this.roles.includes('warehouse')) return 'warehouse';
        return this.roles[0] || null;
    });

    // Helper to check if user has any of the specified roles
    hasRole(roleNames: string | string[]) {
        const checkRoles = Array.isArray(roleNames) ? roleNames : [roleNames];
        return this.roles.some(r => checkRoles.includes(r));
    }

    /** Returns the correct base route for the user's role */
    getRedirectPath(): string {
        if (!this.isAuthenticated) return "/login";

        if (this.hasRole("super_admin")) return "/superadmin";
        if (this.hasRole("owner")) return "/admin";
        if (this.hasRole("manager")) return "/manager";
        if (this.hasRole("teknisi")) return "/technician";
        if (this.hasRole("kasir")) return "/kasir";
        if (this.hasRole("warehouse")) return "/warehouse";

        return "/";
    }

    private _checkAuthPromise: Promise<void> | null = null;

    async checkAuth() {
        if (!browser) return;
        if (this._checkAuthPromise) return this._checkAuthPromise;

        this._checkAuthPromise = (async () => {
            this.loading = true;
            try {
                const res = await api.get("/auth/me");
                this.user = res.data.data || res.data;
            } catch (err) {
                this.user = null;
            } finally {
                this.loading = false;
                this._checkAuthPromise = null;
            }
        })();

        return this._checkAuthPromise;
    }

    setUserInfo(userData: User | null) {
        this.user = userData;
        this.loading = false;
    }

    async logout() {
        try {
            await api.post("/auth/logout");
        } finally {
            this.user = null;
            if (browser) window.location.href = "/login";
        }
    }
}

export const authStore = new AuthStore();
