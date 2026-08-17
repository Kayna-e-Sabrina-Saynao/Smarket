# Git e GitHub — fluxo de trabalho

## Branch principal

- **`ultima-versao`** é a branch de desenvolvimento ativa (o trabalho do dia a dia acontece aqui).
- `main` é o espelho de entrega no GitHub (repo `Kayna-e-Sabrina-Saynao/Smarket`).
- O repositório originalmente tinha `master`; ele foi mantido no GitHub, mas não é mais usado para o desenvolvimento atual.

> A branch `ultima-versao` é local e já está sincronizada com `origin/ultima-versao`. O `master` local contém commits antigos (incluindo a reforma visual) que ainda não foram enviados — cuidado para não misturar histórico.

## Convenção de commits

Usar **Conventional Commits**:

```
feat:     nova funcionalidade
fix:      correção de bug
refactor: reorganização sem mudar comportamento
style:    formatação / tema visual
docs:     documentação
chore:    manutenção (deps, config)
```

Exemplo:

```bash
git commit -m "fix: declare qrcode dependency and use dynamic cycle year"
```

## Rotina recomendada

1. `git status` — confirme o que mudou.
2. `git add <arquivos específicos>` — nunca `add -A` às cegas quando há arquivos não relacionados.
3. Rode `npx tsc --noEmit` e `npm run lint` antes de commitar.
4. Commit com mensagem descritiva (veja acima).
5. `git push origin ultima-versao` (quando autorizado).
6. Para entregar em `main`: `git push origin ultima-versao:main` (ou via pull request no GitHub).

## Regras importantes

- **Nunca commitar secrets**: `apiKey` do Firebase é pública (ok), mas `serviceAccount`, `.pem`, `.key`, `purchaseToken`, etc., nunca entram no repositório.
- `Smarket/` (cópia antiga aninhada) é ignorado no `.gitignore` e excluído do tsconfig.
- Não usar `--force` sem necessidade real e autorização.
- Antes de criar PRs, revisar `git status`, `git diff` e o histórico recente.

## Como rodar a CLI

No PowerShell, o `npx` direto é bloqueado pela política de execução. Use:

```powershell
& "C:\Program Files\nodejs\npx.cmd" tsc --noEmit
& "C:\Program Files\nodejs\npx.cmd" expo lint
```