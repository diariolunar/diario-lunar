# Diário Lunar para Android

O aplicativo usa Capacitor e carrega o site publicado em
`https://diario-lunar.vercel.app`, portanto as atualizações do site aparecem no
app sem que seja necessário gerar um novo APK.

## Gerar o APK de teste

```powershell
cd mobile
npm.cmd install
npm.cmd run apk
```

O APK será criado em
`android/app/build/outputs/apk/debug/app-debug.apk`.

Para publicar na Play Store, gere e assine uma versão release (AAB) com uma
chave de assinatura mantida fora do repositório.
