# Publicar Alquilaap en Google Play

La app de Android abre la web de Alquilaap a pantalla completa (Trusted Web Activity). No hay que mantener otra app: cada cambio en la web llega a la app al momento.

## Antes de empezar

1. **Dominio propio funcionando** con la app (por ejemplo `alquilaap.es`). La app de Android queda atada a ese dominio.
2. **Variables en Railway**: `LEGAL_NAME`, `LEGAL_TAX_ID`, `LEGAL_ADDRESS`, `CONTACT_EMAIL` (salen en /privacidad y /condiciones) y `APP_URL` con el dominio nuevo.
3. **Cuenta de Google Play Console** (25 $, pago único) dada de alta **como organización**, con el número D-U-N-S de la empresa. Las cuentas de particular nuevas deben hacer antes una prueba cerrada con 12 personas durante 14 días.

## Crear el paquete de Android

1. Entra en https://www.pwabuilder.com, escribe `https://alquilaap.es` y pulsa **Start**.
2. **Package for stores → Android → Generate package**. Opciones:
   - Package ID: `es.alquilaap.app` (no se puede cambiar después).
   - App name: `Alquilaap`, Launcher name: `Alquilaap`.
   - Signing key: **Create new** y guarda bien el archivo `.keystore` y sus contraseñas.
3. Descarga el ZIP. Dentro está el `.aab` que se sube a Play Console.

## Conectar la app con la web

1. En Play Console, crea la app y sube el `.aab` a **Pruebas internas**.
2. Ve a **Configuración → Integridad de la app → Firma de apps** y copia la **huella del certificado SHA-256**.
3. En Railway, añade:
   - `ANDROID_PACKAGE` = `es.alquilaap.app`
   - `ANDROID_CERT_SHA256` = la huella copiada. Si también usas la de tu clave de subida, ponlas separadas por comas.
4. Comprueba que `https://alquilaap.es/.well-known/assetlinks.json` muestra el paquete y la huella. Sin esto la app se abre con la barra del navegador.

## Ficha de Play Store

- **Nombre (30 caracteres):** Alquilaap: alquila cerca de ti
- **Descripción breve (80):** Alquila bicis, herramientas, camping y más a gente de tu zona. Publicar es gratis.
- **Categoría:** Compras.
- **Política de privacidad:** `https://alquilaap.es/privacidad`
- **Eliminación de cuenta:** `https://alquilaap.es/borrar-cuenta` (y dentro de la app, en Perfil → Borrar mi cuenta).
- **Icono (512×512) y gráfico destacado (1024×500):** en la carpeta del logo del proyecto (`icono-app-512.png` y `grafico-play-store-1024x500.png`). Además, al menos 2 capturas de móvil.

**Descripción completa (borrador):**

> ¿Necesitas una bici para el fin de semana, un taladro para una tarde o una tienda de campaña para las vacaciones? En Alquilaap lo alquilas a gente de tu zona, por mucho menos que comprarlo.
>
> • Publicar y alquilar es gratis, sin comisiones.
> • Busca por categoría, ciudad o distancia: «cerca de mí».
> • Sello «Verificado» para quien confirma su identidad con DNI o NIE, y anuncios solo para usuarios verificados.
> • Chatea con el propietario antes de reservar.
> • Doble confirmación al entregar y al devolver.
> • Seguro opcional contra daños y robo.
> • El alquiler se paga en mano, al recoger.
>
> Bicicletas, patinetes, herramientas, camping, esquí, kayak, cámaras, consolas, material para fiestas, cosas para bebés y mucho más.
>
> ¿Tienes una tienda de alquiler? Con Alquilaap Pro tus anuncios salen primero y las reservas se aceptan al momento.

## Formulario «Seguridad de los datos» (resumen)

| Dato | Se recoge | Se comparte | Para qué |
| --- | --- | --- | --- |
| Nombre, email, teléfono, dirección | Sí | No | Cuenta, seguridad, prevención de fraude |
| Documento de identidad, fecha de nacimiento, fotos (documento y selfie) | Sí | No | Verificar la identidad y prevenir fraudes |
| Ubicación aproximada | Sí, opcional | No | Mostrar anuncios cercanos |
| Fotos de anuncios | Sí | No | Funcionalidad de la app |
| Mensajes en la app | Sí | No | Funcionalidad de la app |
| Historial de compras (packs, suscripción) | Sí | No | Pagos, gestionados por Stripe |

Datos cifrados en tránsito: **sí**. Los usuarios pueden pedir que se eliminen sus datos: **sí**.
