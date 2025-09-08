const appLogic = () => {
    // URL base da sua API
    const BASE_API_URL = "http://localhost:3000";

    // --- Estado e alternância de UI ---
    let user = window.localStorage.getItem("token");
    let isLoading = false;

    const loginFormContainer = document.getElementById(
        "login-form-container"
    );
    const mainAppContainer = document.getElementById("main-app-container");

    const showLogin = () => {
        loginFormContainer.classList.remove("hidden");
        mainAppContainer.classList.add("hidden");
    };

    const showApp = () => {
        loginFormContainer.classList.add("hidden");
        mainAppContainer.classList.remove("hidden");
        updateAppUI();
    };

    const updateAppUI = () => {
        if (user) {
            document.getElementById("user-email").textContent = user.email;
            document.getElementById("user-email-info").textContent = user.email;
            document.getElementById("user-token").textContent =
                user.token.substring(0, 20) + "...";
        }
    };

    user ? showApp() : showLogin();

    // --- Sistema de Notificação Toast ---
    const toast = ({ title, description, variant }) => {
        const container = document.getElementById("toast-container");
        const toastEl = document.createElement("div");
        let bgColor = "bg-gray-800";
        let borderColor = "border-gray-700";
        if (variant === "destructive") {
            bgColor = "bg-red-500";
            borderColor = "border-red-400";
        }

        toastEl.className = `p-4 rounded-md shadow-lg text-white \${bgColor} border \${borderColor} transition-all transform ease-out duration-300`;
        toastEl.innerHTML = `
                    <div class="flex items-center justify-between">
                        <h4 class="font-semibold">\${title}</h4>
                        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                            &times;
                        </button>
                    </div>
                    <p class="text-sm opacity-90 mt-1">\${description}</p>
                `;
        container.prepend(toastEl);
        setTimeout(() => {
            toastEl.remove();
        }, 5000);
    };

    // --- Lógica do Formulário de Login ---
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");
    const loginButton = document.getElementById("login-button");
    const loginText = document.getElementById("login-text");
    const loginSpinner = document.getElementById("login-spinner");

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            toast({
                title: "Erro",
                description: "Por favor, preencha todos os campos",
                variant: "destructive",
            });
            return;
        }

        isLoading = true;
        loginButton.disabled = true;
        loginText.textContent = "Entrando...";
        loginSpinner.classList.remove("hidden");
        loginButton.classList.add("opacity-50");

        try {
            const response = await fetch(`${BASE_API_URL}/login`, {
                method: "POST",
                headers: {
                    email: email,
                    password: password,
                },
                body: {},
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Falha na autenticação");
            }

            const data = await response.json();
            window.localStorage.setItem("token", data.token);
            toast({
                title: "Login realizado!",
                description: "Bem-vindo ao sistema",
            });

            showApp();
        } catch (error) {
            toast({
                title: "Erro no login",
                description: error.message || "Verifique suas credenciais",
                variant: "destructive",
            });
        } finally {
            isLoading = false;
            loginButton.disabled = false;
            loginText.textContent = "Entrar";
            loginSpinner.classList.add("hidden");
            loginButton.classList.remove("opacity-50");
        }
    };

    loginForm.addEventListener("submit", handleLogin);

    // --- Lógica de Upload de Arquivo ---
    const fileInput = document.getElementById("csv-upload");
    const selectedFileContainer = document.getElementById(
        "selected-file-container"
    );
    const fileNameDisplay = document.getElementById("file-name");
    const fileSizeDisplay = document.getElementById("file-size");
    const uploadButton = document.getElementById("upload-button");
    const uploadText = document.getElementById("upload-text");
    const loadingSpinner = document.getElementById("loading-spinner");
    const successMessage = document.getElementById("success-message");
    const logoutButton = document.getElementById("logout-button");
    const chooseFileButton = document.getElementById("choose-file-button");

    let selectedFile = null;
    let isUploading = false;

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
        );
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        successMessage.classList.add("hidden");

        if (!file) {
            selectedFileContainer.classList.add("hidden");
            return;
        }

        if (!file.name.endsWith(".csv")) {
            toast({
                title: "Arquivo inválido",
                description: "Por favor, selecione um arquivo CSV",
                variant: "destructive",
            });
            fileInput.value = "";
            return;
        }

        selectedFile = file;
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = formatFileSize(file.size);
        selectedFileContainer.classList.remove("hidden");
    };

    const handleUpload = async () => {
        if (!selectedFile || isUploading) return;

        isUploading = true;
        uploadButton.disabled = true;
        uploadText.textContent = "Enviando...";
        loadingSpinner.classList.remove("hidden");
        uploadButton.classList.add("opacity-50");

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await fetch(BASE_API_URL + "/upload/taxas-frete", {
                method: "POST",
                headers: {
                    Authorization: "Bearer" + user.token,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro no envio do arquivo");
            }

            toast({
                title: "Upload realizado!",
                description:
                    "Arquivo " + selectedFile.name + " enviado com sucesso",
            });

            selectedFile = null;
            fileInput.value = "";
            selectedFileContainer.classList.add("hidden");
            successMessage.classList.remove("hidden");
        } catch (error) {
            toast({
                title: "Erro no upload",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            isUploading = false;
            uploadButton.disabled = false;
            uploadText.textContent = "Enviar";
            loadingSpinner.classList.add("hidden");
            uploadButton.classList.remove("opacity-50");
        }
    };

    fileInput.addEventListener("change", handleFileSelect);
    uploadButton.addEventListener("click", handleUpload);

    // Corrige o problema do clique, ativando o input de arquivo quando o botão é clicado.
    chooseFileButton.addEventListener("click", () => fileInput.click());

    // --- Lógica de Logout ---
    const handleLogout = () => {
        user = null;
        emailInput.value = "";
        passwordInput.value = "";
        showLogin();
        toast({
            title: "Sessão encerrada",
            description: "Você saiu do sistema.",
        });
    };

    logoutButton.addEventListener("click", handleLogout);

    // --- Estado Inicial ---
    showLogin();
    lucide.createIcons();
};

document.addEventListener("DOMContentLoaded", appLogic);