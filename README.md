# deliveryCalculation API

API para cálculo de frete a partir de leitura de arquivos para salvar no banco de dados.

## Tecnologias

- Node.js
- Fastify
- TypeScript
- Zod
- LowDB

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/vinicius2407/deliveryCalculation.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```

## Como Usar

### Modo de Desenvolvimento

Para iniciar o servidor em modo de desenvolvimento, execute:

```bash
npm run dev
```

O servidor irá reiniciar automaticamente a cada alteração nos arquivos.

### Produção

Para compilar o código e iniciar o servidor em modo de produção, execute:

```bash
npm run build
npm run start
```

## Endpoints da API

### Autenticação

- `POST /login`

  Autentica um usuário e retorna um token JWT.

### Upload

- `POST /upload/taxas-frete`

  Faz o upload de um arquivo com as taxas de frete. Requer autenticação.

- `POST /upload/parse-precos`

  Faz o upload e processa um arquivo de preços. Requer autenticação.

### Cálculo de Frete

- `POST /calculo-frete`

  Calcula o valor do frete com base nos dados fornecidos.
