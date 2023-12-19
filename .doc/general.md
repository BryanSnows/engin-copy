# Requisitos gerais

##  Para rodar o projeto

1. Certifique-se que o NodeJS está instalado na máquina
2. Certifique-se que o CLI do Nest está instalado de forma global
   > `yarn global add @nestjs/cli`
3. Rode o Nest

   > `nest start –-watch`

   ou rode em modo de desenvolvimento (na pasta mãe do projeto). Esse modo fará um reload sempre que o projeto for salvo:

   > `yarn start:dev`

4. Acesse o localhost no navegador: http://localhost:3000
5. Ajustar configurações do VsCode:
   - Pressionar **"Ctrl + ,"** no teclado
   - Editor: Default Formatter: Prettier
   - Editor: Format On Save: ✅
6. Instale as dependências:
   > `yarn`

## Para comitar
-  Utilize conventional commits: https://www.conventionalcommits.org/pt-br/v1.0.0/

## Rodando o swagger