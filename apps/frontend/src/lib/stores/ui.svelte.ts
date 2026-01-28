import { browser } from "$app/environment";

function createUIStore() {
    let isSidebarCollapsed = $state(false);

    // Initialize from localStorage if available
    if (browser) {
        const stored = localStorage.getItem("sidebarCollapsed");
        if (stored) {
            isSidebarCollapsed = JSON.parse(stored);
        }
    }

    return {
        get isSidebarCollapsed() {
            return isSidebarCollapsed;
        },
        toggleSidebar: () => {
            isSidebarCollapsed = !isSidebarCollapsed;
            if (browser) {
                localStorage.setItem("sidebarCollapsed", JSON.stringify(isSidebarCollapsed));
            }
        },
        setSidebarCollapsed: (value: boolean) => {
            isSidebarCollapsed = value;
            if (browser) {
                localStorage.setItem("sidebarCollapsed", JSON.stringify(value));
            }
        }
    };
}

export const uiStore = createUIStore();
