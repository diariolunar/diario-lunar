# Diario Lunar

## Firebase Storage CORS

O otimizador de imagens antigas baixa os arquivos pelo navegador antes de reenviar a versao comprimida. Para isso funcionar, o bucket do Firebase Storage precisa aceitar requisicoes CORS dos dominios do site.

Depois de alterar `firebase-storage-cors.json`, aplique a configuracao no bucket:

```powershell
gcloud config set project diario-lunar-dee91
gcloud storage buckets update gs://diario-lunar-dee91.firebasestorage.app --cors-file=firebase-storage-cors.json
```

Para conferir a configuracao aplicada:

```powershell
gcloud storage buckets describe gs://diario-lunar-dee91.firebasestorage.app --format="default(cors_config)"
```

Se o ADM for publicado em outro dominio, adicione esse dominio na lista `origin` do `firebase-storage-cors.json` e rode o comando de atualizacao novamente.

## Firebase Storage Rules

As regras do Storage ficam em `storage.rules`. Elas permitem leitura publica, uploads de imagens por ADMs ativos e delete apenas para superadmins ou ADMs com permissao `gerenciarAdmins`.

Para publicar:

```powershell
firebase deploy --only storage --project diario-lunar-dee91
```
