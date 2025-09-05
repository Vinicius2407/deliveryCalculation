import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { routes } from './routes';
import fastifyMultipart from '@fastify/multipart';

export class FastifyServer {
    private app = fastify({ logger: true });

    htmlPage = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistema de Upload de CSV</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- Lucide Icons -->
        <script src="https://unpkg.com/lucide@latest"></script>
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background-color: #f0f4f8;
                color: #1e293b;
            }
            .bg-gradient-secondary {
                background-color: #f1f5f9;
            }
            .bg-gradient-glass {
                background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
            }
            .bg-gradient-primary {
                background: linear-gradient(to right, #6366f1, #8b5cf6);
            }
            .shadow-soft {
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            }
            .hover\\:shadow-glow:hover {
                box-shadow: 0 0 20px 5px rgba(99, 102, 241, 0.5);
            }
            .text-primary-foreground {
                color: #f8fafc;
            }
            .text-muted-foreground {
                color: #64748b;
            }
            .text-foreground {
                color: #0f172a;
            }
            .text-success {
                color: #22c55e;
            }
            .bg-card\\/80 {
                background-color: rgba(255, 255, 255, 0.8);
            }
            .border-border\\/20 {
                border-color: rgba(226, 232, 240, 0.2);
            }
            .bg-primary\\/10 {
                background-color: rgba(99, 102, 241, 0.1);
            }
            .border-border\\/50 {
                border-color: rgba(226, 232, 240, 0.5);
            }
            .bg-muted\\/20 {
                background-color: rgba(241, 245, 249, 0.2);
            }
            .bg-success\\/10 {
                background-color: rgba(34, 197, 94, 0.1);
            }
            .border-success\\/20 {
                border-color: rgba(34, 197, 94, 0.2);
            }
            .animate-pulse-glow {
                animation: pulse-glow 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
            }
            @keyframes pulse-glow {
                0%, 100% {
                    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
                }
                50% {
                    box-shadow: 0 0 0 15px rgba(99, 102, 241, 0);
                }
            }
        </style>
    </head>
    <body class="bg-gradient-secondary min-h-screen flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gradient-glass backdrop-blur-sm"></div>
    
        <!-- Login Form -->
        <div id="login-form-container" class="w-full max-w-md relative z-10 hidden">
            <div class="rounded-lg border-border/20 bg-card/80 backdrop-blur-xl shadow-soft p-4">
                <div class="text-center space-y-2 py-4">
                    <div class="w-20 h-20 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-glow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10 text-primary-foreground"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <h2 class="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        Acesso ao Sistema
                    </h2>
                    <p class="text-muted-foreground">
                        Digite suas credenciais para continuar
                    </p>
                </div>
                
                <div class="p-6 pt-0">
                    <form id="login-form" class="space-y-4">
                        <div class="space-y-2">
                            <label for="email" class="text-foreground font-medium">Email</label>
                            <div class="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                                <input id="email-input" type="email" placeholder="seu@email.com" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 bg-gray-50/50 border-gray-200/50 focus:border-indigo-500 focus:ring-indigo-500">
                            </div>
                        </div>
                        
                        <div class="space-y-2">
                            <label for="password" class="text-foreground font-medium">Senha</label>
                            <div class="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <input id="password-input" type="password" placeholder="••••••••" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 bg-gray-50/50 border-gray-200/50 focus:border-indigo-500 focus:ring-indigo-500">
                            </div>
                        </div>
                        
                        <button type="submit" id="login-button" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 px-4 py-2 w-full bg-gradient-primary text-white hover:shadow-glow transition-all duration-300 transform hover:scale-105">
                            <div id="login-spinner" class="hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span id="login-text">Entrar</span>
                        </button>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <p class="text-sm text-muted-foreground">
                            Use qualquer email e senha para demonstração
                        </p>
                    </div>
                </div>
            </div>
        </div>
    
        <!-- Main App Container -->
        <div id="main-app-container" class="container mx-auto max-w-4xl relative z-10 p-4 sm:p-8 hidden">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row justify-between items-center mb-8">
                <div class="flex items-center space-x-3 mb-4 sm:mb-0">
                    <div class="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-primary-foreground"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" x2="16" y1="13" y2="13"></line><line x1="8" x2="16" y1="17" y2="17"></line><line x1="10" x2="14" y1="9" y2="9"></line></svg>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-foreground">
                            Sistema de Upload
                        </h1>
                        <p class="text-muted-foreground">
                            Envie seus arquivos CSV
                        </p>
                    </div>
                </div>
                
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2 text-sm text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <span id="user-email"></span>
                    </div>
                    <button id="logout-button" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 hover:bg-destructive hover:text-destructive-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
                        Sair
                    </button>
                </div>
            </div>
    
            <!-- Upload Card -->
            <div class="rounded-lg border-border/20 bg-card/80 backdrop-blur-xl shadow-soft p-4">
                <div class="flex items-center space-x-2 border-b pb-4 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-indigo-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                    <h2 class="text-xl font-semibold text-foreground">Upload de Arquivo CSV</h2>
                </div>
                
                <p class="text-muted-foreground mb-6">Selecione um arquivo CSV para upload. O token de autenticação será usado automaticamente.</p>
                
                <div class="space-y-6">
                    <!-- File Input -->
                    <div class="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-indigo-500/50 transition-colors">
                        <div class="flex flex-col items-center space-y-4">
                            <div class="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-indigo-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                            </div>
                            
                            <div>
                                <p class="text-lg font-medium text-foreground mb-1">Selecione um arquivo CSV</p>
                                <p class="text-sm text-muted-foreground">Arraste e solte ou clique para escolher</p>
                            </div>
                            
                            <input id="csv-upload" type="file" accept=".csv" class="hidden">
                            <label for="csv-upload">
                                <button id="choose-file-button" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 cursor-pointer">
                                    Escolher Arquivo
                                </button>
                            </label>
                        </div>
                    </div>
    
                    <!-- Selected File -->
                    <div id="selected-file-container" class="hidden bg-gray-100/20 rounded-lg p-4 border border-border/20">
                        <div class="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-indigo-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" x2="16" y1="13" y2="13"></line><line x1="8" x2="16" y1="17" y2="17"></line><line x1="10" x2="14" y1="9" y2="9"></line></svg>
                                </div>
                                <div>
                                    <p id="file-name" class="font-medium text-foreground"></p>
                                    <p id="file-size" class="text-sm text-muted-foreground"></p>
                                </div>
                            </div>
                            
                            <button id="upload-button" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-4 py-2 bg-gradient-primary text-white hover:shadow-glow transition-all duration-300">
                                <svg id="upload-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                                <div id="loading-spinner" class="hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span id="upload-text">Enviar</span>
                            </button>
                        </div>
                    </div>
    
                    <!-- Success Message -->
                    <div id="success-message" class="hidden bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <div class="flex items-center space-x-2 text-success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span class="font-medium">Upload realizado com sucesso!</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    
        <!-- Simple Toast Notification System -->
        <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>
    
        <script>
            const appLogic = () => {
                // URL base da sua API
                const BASE_API_URL = 'http://localhost:3000';
                
                // --- Estado e alternância de UI ---
                let user = null;
                let isLoading = false;
    
                const loginFormContainer = document.getElementById('login-form-container');
                const mainAppContainer = document.getElementById('main-app-container');
    
                const showLogin = () => {
                    loginFormContainer.classList.remove('hidden');
                    mainAppContainer.classList.add('hidden');
                };
    
                const showApp = () => {
                    loginFormContainer.classList.add('hidden');
                    mainAppContainer.classList.remove('hidden');
                    updateAppUI();
                };
    
                const updateAppUI = () => {
                    if (user) {
                        document.getElementById('user-email').textContent = user.email;
                        document.getElementById('user-email-info').textContent = user.email;
                        document.getElementById('user-token').textContent = user.token.substring(0, 20) + '...';
                    }
                };
    
                // --- Sistema de Notificação Toast ---
                const toast = ({ title, description, variant }) => {
                    const container = document.getElementById('toast-container');
                    const toastEl = document.createElement('div');
                    let bgColor = 'bg-gray-800';
                    let borderColor = 'border-gray-700';
                    if (variant === 'destructive') {
                        bgColor = 'bg-red-500';
                        borderColor = 'border-red-400';
                    }
    
                    toastEl.className = \`p-4 rounded-md shadow-lg text-white \${bgColor} border \${borderColor} transition-all transform ease-out duration-300\`;
                    toastEl.innerHTML = \`
                        <div class="flex items-center justify-between">
                            <h4 class="font-semibold">\${title}</h4>
                            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                                &times;
                            </button>
                        </div>
                        <p class="text-sm opacity-90 mt-1">\${description}</p>
                    \`;
                    container.prepend(toastEl);
                    setTimeout(() => {
                        toastEl.remove();
                    }, 5000);
                };
    
                // --- Lógica do Formulário de Login ---
                const loginForm = document.getElementById('login-form');
                const emailInput = document.getElementById('email-input');
                const passwordInput = document.getElementById('password-input');
                const loginButton = document.getElementById('login-button');
                const loginText = document.getElementById('login-text');
                const loginSpinner = document.getElementById('login-spinner');
    
                const handleLogin = async (e) => {
                    e.preventDefault();
                    const email = emailInput.value.trim();
                    const password = passwordInput.value.trim();
    
                    if (!email || !password) {
                        toast({
                            title: 'Erro',
                            description: 'Por favor, preencha todos os campos',
                            variant: 'destructive',
                        });
                        return;
                    }
                    
                    isLoading = true;
                    loginButton.disabled = true;
                    loginText.textContent = 'Entrando...';
                    loginSpinner.classList.remove('hidden');
                    loginButton.classList.add('opacity-50');
    
                    try {
                        const response = await fetch(\`\${BASE_API_URL}/login\`, {
                            method: 'POST',
                            headers: {
                                // ATENÇÃO: Enviar credenciais no cabeçalho é menos seguro que no corpo da requisição.
                                // Para esta demonstração, seguimos a instrução do prompt.
                                'email': email,
                                'password': password,
                            },
                            // Para enviar no corpo da requisição (método mais seguro):
                            body: {}
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Falha na autenticação');
                        }
                        
                        const data = await response.json();
                        
                        user = {
                            email: email,
                            token: data.token,
                        };
    
                        toast({
                            title: 'Login realizado!',
                            description: 'Bem-vindo ao sistema',
                        });
                        
                        showApp();
    
                    } catch (error) {
                        toast({
                            title: 'Erro no login',
                            description: error.message || 'Verifique suas credenciais',
                            variant: 'destructive',
                        });
                    } finally {
                        isLoading = false;
                        loginButton.disabled = false;
                        loginText.textContent = 'Entrar';
                        loginSpinner.classList.add('hidden');
                        loginButton.classList.remove('opacity-50');
                    }
                };
                
                loginForm.addEventListener('submit', handleLogin);
    
                // --- Lógica de Upload de Arquivo ---
                const fileInput = document.getElementById('csv-upload');
                const selectedFileContainer = document.getElementById('selected-file-container');
                const fileNameDisplay = document.getElementById('file-name');
                const fileSizeDisplay = document.getElementById('file-size');
                const uploadButton = document.getElementById('upload-button');
                const uploadText = document.getElementById('upload-text');
                const loadingSpinner = document.getElementById('loading-spinner');
                const successMessage = document.getElementById('success-message');
                const logoutButton = document.getElementById('logout-button');
                const chooseFileButton = document.getElementById('choose-file-button');
    
                let selectedFile = null;
                let isUploading = false;
    
                const formatFileSize = (bytes) => {
                    if (bytes === 0) return '0 Bytes';
                    const k = 1024;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };
    
                const handleFileSelect = (e) => {
                    const file = e.target.files[0];
                    successMessage.classList.add('hidden');
    
                    if (!file) {
                        selectedFileContainer.classList.add('hidden');
                        return;
                    }
                    
                    if (!file.name.endsWith('.csv')) {
                        toast({
                            title: 'Arquivo inválido',
                            description: 'Por favor, selecione um arquivo CSV',
                            variant: 'destructive',
                        });
                        fileInput.value = '';
                        return;
                    }
                    
                    selectedFile = file;
                    fileNameDisplay.textContent = file.name;
                    fileSizeDisplay.textContent = formatFileSize(file.size);
                    selectedFileContainer.classList.remove('hidden');
                };
    
                const handleUpload = async () => {
                    if (!selectedFile || isUploading) return;
    
                    isUploading = true;
                    uploadButton.disabled = true;
                    uploadText.textContent = 'Enviando...';
                    loadingSpinner.classList.remove('hidden');
                    uploadButton.classList.add('opacity-50');
    
                    const formData = new FormData();
                    formData.append('file', selectedFile);
    
                    try {
                        const response = await fetch(BASE_API_URL + '/upload/taxas-frete', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer' + user.token,
                            },
                            body: formData,
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Erro no envio do arquivo');
                        }
                        
                        toast({
                            title: 'Upload realizado!',
                            description: 'Arquivo '+ selectedFile.name + ' enviado com sucesso',
                        });
                        
                        selectedFile = null;
                        fileInput.value = '';
                        selectedFileContainer.classList.add('hidden');
                        successMessage.classList.remove('hidden');
    
                    } catch (error) {
                        toast({
                            title: 'Erro no upload',
                            description: error.message,
                            variant: 'destructive',
                        });
                    } finally {
                        isUploading = false;
                        uploadButton.disabled = false;
                        uploadText.textContent = 'Enviar';
                        loadingSpinner.classList.add('hidden');
                        uploadButton.classList.remove('opacity-50');
                    }
                };
                
                fileInput.addEventListener('change', handleFileSelect);
                uploadButton.addEventListener('click', handleUpload);
                
                // Corrige o problema do clique, ativando o input de arquivo quando o botão é clicado.
                chooseFileButton.addEventListener('click', () => fileInput.click());
    
                // --- Lógica de Logout ---
                const handleLogout = () => {
                    user = null;
                    emailInput.value = '';
                    passwordInput.value = '';
                    showLogin();
                    toast({
                        title: 'Sessão encerrada',
                        description: 'Você saiu do sistema.',
                    });
                };
    
                logoutButton.addEventListener('click', handleLogout);
    
                // --- Estado Inicial ---
                showLogin();
                lucide.createIcons();
            };
    
            document.addEventListener('DOMContentLoaded', appLogic);
        </script>
    </body>
    </html>`;
    


    private async setup() {
        this.app.register(fastifyMultipart);

        this.app.register(require('@fastify/jwt'), { secret: 'faksldjf;alksjdfl;k3j2l;fj2;lfja;lkfj;saldkf' });

        this.app.decorate("authenticate",
            async function (request: FastifyRequest, reply: FastifyReply) {
                try {
                    await request.jwtVerify()
                } catch (err) {
                    reply.send(err)
                }
            });

        this.app.get('/', async (request, reply) => {
            reply.type('text/html').send(this.htmlPage);
        });

        this.app.register(routes);
    }

    async start(port: number) {
        try {
            await this.setup();
            await this.app.ready();
            await this.app.listen({ port });
            console.log(`Server running at http://localhost:${port}`);
        } catch (err) {
            console.error("Error starting server:", err);
            await this.app.close();
            process.exit(1);
        }
    }
}
