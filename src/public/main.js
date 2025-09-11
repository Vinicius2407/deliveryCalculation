const appLogic = () => {
    const BASE_API_URL = "http://localhost:3000";

    const loginFormContainer = document.getElementById("login-form-container");
    const mainAppContainer = document.getElementById("main-app-container");
    const toastContainer = document.getElementById("toast-container");
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");
    const loginButton = document.getElementById("login-button");
    const loginText = document.getElementById("login-text");
    const loginSpinner = document.getElementById("login-spinner");
    const logoutButton = document.getElementById("logout-button");
    const userEmailDisplay = document.getElementById("user-email");

    const fileInput = document.getElementById("csv-upload");
    const chooseFileButton = document.getElementById("choose-file-button");
    const selectedFileContainer = document.getElementById("selected-file-container");
    const fileNameDisplay = document.getElementById("file-name");
    const fileSizeDisplay = document.getElementById("file-size");
    const uploadButton = document.getElementById("upload-button");
    const uploadText = document.getElementById("upload-text");
    const loadingSpinner = document.getElementById("loading-spinner");
    const successMessage = document.getElementById("success-message");

    const fileInputPrice = document.getElementById("csv-upload-price");
    const choosePriceFileButton = document.getElementById("choose-file-price-button");
    const selectedFilePriceContainer = document.getElementById("selected-file-price-container");
    const fileNamePriceDisplay = document.getElementById("file-price-name");
    const fileSizePriceDisplay = document.getElementById("file-price-size");
    const uploadPriceButton = document.getElementById("upload-price-button");
    const uploadPriceText = document.getElementById("upload-price-text");
    const loadingPriceSpinner = document.getElementById("loading-price-spinner");
    const successPriceMessage = document.getElementById("success-price-message");

    let selectedFile = null;
    let selectedPriceFile = null;

    const toast = ({ title, description, variant }) => {
        const toastEl = document.createElement("div");
        const bgColor = variant === "destructive" ? "bg-red-500" : "bg-gray-800";
        const borderColor = variant === "destructive" ? "border-red-400" : "border-gray-700";

        toastEl.className = `p-4 rounded-md shadow-lg text-white ${bgColor} border ${borderColor} transition-all transform ease-out duration-300`;
        toastEl.innerHTML = `
            <div class="flex items-center justify-between">
                <h4 class="font-semibold">${title}</h4>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <p class="text-sm opacity-90 mt-1">${description}</p>
        `;
        toastContainer?.prepend(toastEl);
        setTimeout(() => toastEl.remove(), 5000);
    };

    const apiFetch = async (url, options = {}) => {
        const token = window.localStorage.getItem("token");
        const headers = { ...options.headers };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            handleLogout(true);
            return Promise.reject(new Error("Sessão expirada"));
        }

        return response;
    };

    const showLogin = () => {
        loginFormContainer.classList.remove("hidden");
        mainAppContainer.classList.add("hidden");
    };

    const showApp = () => {
        const token = window.localStorage.getItem("token");
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userEmailDisplay.textContent = payload.email;
        } catch (e) {
            console.error("Erro ao decodificar o token:", e);
            handleLogout(true);
            return;
        }

        loginFormContainer.classList.add("hidden");
        mainAppContainer.classList.remove("hidden");
    };

    const handleLogout = (isSessionExpired = false) => {
        window.localStorage.removeItem("token");
        emailInput.value = "";
        passwordInput.value = "";
        showLogin();
        if (isSessionExpired) {
            toast({ title: "Sessão Expirada", description: "Por favor, faça o login novamente.", variant: "destructive" });
        } else {
            toast({ title: "Sessão Encerrada", description: "Você saiu do sistema." });
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            return toast({ title: "Erro", description: "Por favor, preencha todos os campos", variant: "destructive" });
        }

        loginButton.disabled = true;
        loginText.textContent = "Entrando...";
        loginSpinner.classList.remove("hidden");

        try {
            const response = await fetch(`${BASE_API_URL}/login`, {
                method: "POST",
                headers: { email, password },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Falha na autenticação");
            }

            const data = await response.json();
            window.localStorage.setItem("token", data.token);
            toast({ title: "Login realizado!", description: "Bem-vindo ao sistema" });
            showApp();
        } catch (error) {
            toast({ title: "Erro no login", description: error.message, variant: "destructive" });
        } finally {
            loginButton.disabled = false;
            loginText.textContent = "Entrar";
            loginSpinner.classList.add("hidden");
        }
    };

    const createUploadHandler = (endpoint) => async (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await apiFetch(`${BASE_API_URL}${endpoint}`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro no envio do arquivo");
            }
            const result = await response.json();
            toast({ title: "Upload realizado!", description: result.message || `Arquivo ${file.name} enviado com sucesso` });
            return true;
        } catch (error) {
            if (error.message !== "Sessão expirada") {
               toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
            }
            return false;
        }
    };

    const handleTaxasUpload = createUploadHandler("/upload/taxas-frete");
    const handlePrecosUpload = createUploadHandler("/upload/parse-precos");

    const setupUploadComponent = (config) => {
        let currentFile = null;

        config.fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            config.successMessage.classList.add("hidden");
            if (file && file.name.endsWith(".csv")) {
                currentFile = file;
                config.fileNameDisplay.textContent = file.name;
                config.fileSizeDisplay.textContent = (file.size / 1024).toFixed(2) + " KB";
                config.selectedFileContainer.classList.remove("hidden");
            } else {
                currentFile = null;
                config.selectedFileContainer.classList.add("hidden");
                if (file) toast({ title: "Arquivo inválido", description: "Selecione um arquivo CSV.", variant: "destructive" });
            }
        });

        config.chooseFileButton.addEventListener("click", () => config.fileInput.click());

        config.uploadButton.addEventListener("click", async () => {
            if (!currentFile) return;

            config.uploadButton.disabled = true;
            config.uploadText.textContent = "Enviando...";
            config.loadingSpinner.classList.remove("hidden");

            const success = await config.uploadHandler(currentFile);
            if (success) {
                currentFile = null;
                config.fileInput.value = "";
                config.selectedFileContainer.classList.add("hidden");
                config.successMessage.classList.remove("hidden");
            }

            config.uploadButton.disabled = false;
            config.uploadText.textContent = "Enviar";
            config.loadingSpinner.classList.add("hidden");
        });
    };

    setupUploadComponent({
        fileInput, chooseFileButton, selectedFileContainer, fileNameDisplay, fileSizeDisplay, uploadButton, uploadText, loadingSpinner, successMessage,
        uploadHandler: handleTaxasUpload
    });

    setupUploadComponent({
        fileInput: fileInputPrice, chooseFileButton: choosePriceFileButton, selectedFileContainer: selectedFilePriceContainer, fileNameDisplay: fileNamePriceDisplay, fileSizeDisplay: fileSizePriceDisplay, uploadButton: uploadPriceButton, uploadText: uploadPriceText, loadingSpinner: loadingPriceSpinner, successMessage: successPriceMessage,
        uploadHandler: handlePrecosUpload
    });

    loginForm.addEventListener("submit", handleLogin);
    logoutButton.addEventListener("click", () => handleLogout(false));

    window.localStorage.getItem("token") ? showApp() : showLogin();
    lucide.createIcons();
};

document.addEventListener("DOMContentLoaded", appLogic);