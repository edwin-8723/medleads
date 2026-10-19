# Respuestas — Prueba técnica Full Stack Semi Senior (AH MEDTECH)

Candidato: Edwin

---

## Parte A — Conocimientos técnicos

### A.1 Selección múltiple

1-b, 2-b, 3-b, 4-b, 5-c, 6-a, 7-b, 8-b, 9-a, 10-b, 11-b, 12-b, 13-b, 14-b, 15-a

### A.2 Respuesta corta

**16. Autenticación y autorización; JWT entre NestJS y Next.js**

La autenticación responde a "¿quién eres?" y la autorización a "¿qué te dejo hacer?". Primero compruebo la identidad (login) y después, con esa identidad, decido a qué rutas o acciones tiene acceso (por ejemplo, solo un admin puede cambiar el estado de una solicitud).

Con NestJS lo plantearía así: en `POST /auth/login` valido las credenciales (la contraseña guardada con bcrypt o argon2) y devuelvo un access token JWT de vida corta, de unos 15 minutos, con el id y el rol del usuario. Junto a él entrego un refresh token de más duración (7 a 30 días) que guardo hasheado en la base de datos para poder revocarlo. Un `JwtAuthGuard` valida el access token en cada petición y un `RolesGuard` con un decorador `@Roles()` controla el acceso por rol. Cuando el access token vence, el cliente llama a `/auth/refresh`; ahí roto el refresh token (emito uno nuevo e invalido el anterior) y, si alguien reutiliza uno viejo, cierro toda la sesión.

En el cliente guardaría los tokens en cookies `httpOnly`, `Secure` y `SameSite`, y no en `localStorage`. Una cookie `httpOnly` no se puede leer desde JavaScript, así que si hay un XSS el atacante no se lleva el token. Para que la cookie sea de primera parte sirvo el front y la API bajo el mismo origen (en la prueba lo hice con un `rewrite` de Next.js) y, como las cookies se envían solas, me cuido del CSRF con `SameSite` y una cabecera personalizada en las peticiones que modifican datos.

**17. `git merge` vs `git rebase` y un flujo de ramas**

`merge` une dos ramas con un commit de fusión: conserva el historial tal como ocurrió, aunque con el tiempo se llena de commits de merge. `rebase` en cambio vuelve a aplicar mis commits encima de la rama destino y deja un historial lineal y limpio, pero reescribe commits; por eso solo lo uso en mis ramas locales y nunca en ramas compartidas que ya se publicaron.

Para un equipo pequeño que despliega en VPS usaría algo simple: `main` siempre refleja producción y está protegida; cada cambio sale de una rama corta (`feature/...` o `fix/...`) creada desde `main`. Antes de abrir el Pull Request actualizo mi rama con `git rebase main`, el PR pasa por revisión y por un CI con lint, tests y build, y se integra con *squash merge*. El despliegue sale de `main`: un GitHub Action entra por SSH al VPS y ejecuta `git pull` y `docker compose up -d --build`. Cada versión estable la marco con un tag (`v1.2.0`), de modo que volver atrás es desplegar el tag anterior. Para urgencias, un hotfix sale directo de `main` y se integra de inmediato.

**18. LCP de 5 segundos en móvil (Next.js)**

Lo primero es saber qué elemento es el LCP, normalmente una imagen grande o un título, y atacarlo así:

1. Optimizar esa imagen: usar `next/image` con `priority`, un `sizes` correcto, formato WebP/AVIF y dimensiones explícitas.
2. Bajar el tiempo de respuesta del servidor: pasar de SSR sin caché a generación estática o ISR (`revalidate`) y apoyarme en un CDN.
3. Reducir el JavaScript que bloquea el render: partir el bundle, cargar con `dynamic import` lo pesado y mover los scripts de terceros (chat, analítica) a `next/script` con `lazyOnload`.
4. Cargar las fuentes con `next/font`, que las sirve desde el propio dominio y evita que el texto quede esperando.
5. Preferir Server Components para mandar menos JavaScript al cliente, y servir todo comprimido (brotli/gzip) con cabeceras de caché largas.

Después vuelvo a medir en PageSpeed para comprobar que cada cambio realmente ayudó.

**19. WordPress: personalizaciones y actualizaciones**

Para no perder el código cuando se actualiza el tema, no lo escribo en el tema principal. Uso un tema hijo o, mejor aún, un plugin propio (o un `mu-plugin`) donde defino el shortcode con `add_shortcode` o el endpoint con `register_rest_route`. Así la funcionalidad es independiente del tema y además puedo versionarla en Git.

Antes de actualizar plugins en un sitio en producción: hago un backup completo (archivos y base de datos) y compruebo que se puede restaurar; clono el sitio a un entorno de pruebas (staging) y actualizo ahí primero; leo el changelog y reviso la compatibilidad con la versión de PHP y de WordPress y con los demás plugins. Actualizo de uno en uno, en un horario de poco tráfico, y después reviso lo crítico (formularios, pagos, el `debug.log`). Si algo falla, tengo el plan de volver al backup o reinstalar la versión anterior.

**20. SQL**

```sql
SELECT
  fuente,
  COUNT(*)                                             AS total_leads,
  COUNT(*) FILTER (WHERE estado = 'convertido')        AS convertidos,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE estado = 'convertido') / COUNT(*),
    2
  )                                                    AS tasa_conversion_pct
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY fuente
ORDER BY tasa_conversion_pct DESC;
```

---

## Parte C — Casos de diagnóstico e infraestructura

### Caso 1 · Sitio caído después de un reinicio (502)

**a) Cómo diagnostico la causa**

Un 502 me dice que Nginx está vivo pero no recibe respuesta de la aplicación, así que empiezo por ahí y voy de afuera hacia adentro, sin cambiar nada todavía:

```bash
ssh usuario@ip
systemctl status nginx                       # ¿Nginx está activo?
sudo nginx -t                                # ¿la configuración es válida?
sudo tail -n 100 /var/log/nginx/error.log    # busco "connect() failed ... upstream"
docker ps -a                                 # ¿el contenedor de la app está arriba o en "Exited"?
docker logs --tail 100 <contenedor>          # ¿por qué no arrancó?
systemctl status docker                      # ¿Docker arrancó tras el reinicio?
ss -tlnp | grep -E ':80|:443|:3000'          # ¿quién escucha y en qué puerto? ¿coincide con proxy_pass?
df -h && free -m                             # ¿disco lleno o sin memoria?
```

Lo más común después de un reinicio es que el contenedor no tenía política de reinicio y quedó detenido, que arrancó antes que la base de datos de la que depende, o que falta un volumen o el archivo `.env`.

**b) Cómo lo soluciono sin afectar los demás servicios**

Trabajo solo sobre la aplicación afectada: `docker compose up -d <servicio>` (o `docker start <contenedor>`) desde la carpeta del proyecto, sigo `docker logs -f` hasta que responda y lo pruebo con `curl -I http://127.0.0.1:<puerto>` y luego con el dominio. No reinicio Docker completo ni el servidor, porque tumbaría n8n que está en la misma máquina. Si tengo que tocar Nginx, uso `nginx -t && systemctl reload nginx`, que recarga sin cortar conexiones. Si el problema fuera el certificado, `certbot renew --dry-run` y luego `certbot renew`.

**c) Cómo evito que se repita y me entero antes que los usuarios**

- `restart: unless-stopped` en todos los servicios del `docker-compose.yml`, `systemctl enable docker nginx` y, para la base de datos, un `healthcheck` con `depends_on`.
- Un endpoint `/health` y un `HEALTHCHECK` en la imagen.
- Monitoreo externo (UptimeRobot, Better Stack o Uptime Kuma) sobre el sitio y sobre n8n, con avisos por correo o mensajería, más alertas de disco, memoria y vencimiento del certificado.
- Renovación automática de Let's Encrypt (`certbot.timer`) con un `--deploy-hook` que recargue Nginx.
- Rotación de logs y snapshots programados del Droplet.
- Dejar un runbook corto con estos pasos para que cualquiera del equipo pueda seguirlo.

### Caso 2 · Código en producción sin control de versiones

**a) Qué hago antes de tocar nada**

1. Respaldo de todo: snapshot del VPS, copia de la carpeta de la aplicación, un `pg_dump` de la base de datos y de los `.env`. Sin eso no modifico nada.
2. Entender el entorno: `docker ps`, `docker compose config`, versiones de Node y Nginx, tareas cron, servicios de systemd, puertos y variables necesarias.
3. Averiguar qué cambió realmente: clono el repositorio en una carpeta aparte y lo comparo con el código del servidor (`diff -ruN` o `rsync -avnc` en modo simulación), excluyendo `node_modules`, `.next` y `dist`.
4. Hablar con quien conozca el sistema para confirmar quién despliega, qué credenciales existen y cómo debería comportarse en producción.

**b) Cómo llevo el código del servidor a GitHub de forma segura**

Creo una rama nueva (por ejemplo `prod-snapshot`), copio el código real del servidor, sin `node_modules` ni builds, y hago un commit con el estado exacto de producción. Luego reviso el diff contra `main` y lo integro con un Pull Request, así el historial refleja lo que de verdad está corriendo.

Con los secretos tengo cuidado antes del primer `git add`: dejo un `.gitignore` con `.env*`, llaves, `*.pem`, volúmenes y `uploads/`; reviso `git status` y paso `gitleaks` o `trufflehog` para asegurarme de que no se coló ninguna clave. Los valores reales se quedan en el servidor (o en un gestor de secretos) y en el repositorio dejo un `.env.example` con nombres de variables y valores ficticios. Si alguna credencial llegó a subirse alguna vez, la roto: borrarla del historial no basta. El repositorio debe ser privado, con ramas protegidas y 2FA.

**c) Flujo de despliegue de ahora en adelante**

Rama `feature/*` → Pull Request con revisión → CI (lint, tests y build) → merge a `main` → GitHub Actions despliega por SSH (`git pull`, `docker compose build && up -d` y migraciones), con los secretos guardados en GitHub Secrets. Las versiones se etiquetan con tags para poder volver atrás rápido, existe un entorno de staging para probar antes de producción, hay un healthcheck tras cada despliegue y backups automáticos de la base de datos. La regla de oro: nadie edita código directamente en el servidor.

### Caso 3 · Costos del chatbot de IA

**a) Qué reviso para encontrar la causa**

- El panel del proveedor del modelo: consumo por clave de API, por modelo y por día, para ver cuándo empezó el aumento y si pesan más los tokens de entrada o los de salida.
- Los logs del chatbot, de n8n y de ManyChat: cuántas veces se ejecuta cada flujo, si hay bucles o reintentos infinitos, webhooks duplicados o un trabajo que reprocesa el mismo mensaje.
- El tamaño de los prompts: un historial de conversación que crece sin límite, documentos o contexto enviados completos en cada llamada, o un cambio a un modelo más caro.
- Tráfico raro: muchas peticiones desde pocas IP o usuarios, bots, gente usando el chatbot como un ChatGPT gratuito, o conversaciones larguísimas.
- Qué cambió recientemente (despliegues, flujos nuevos, cambios de modelo) y cómo se compara el consumo con los leads reales.

**b) Controles técnicos para limitar costos y abusos**

- Rate limiting por IP, por usuario o sesión y por número de WhatsApp/ManyChat, además de un máximo de mensajes por conversación y por día.
- Límite de `max_tokens` en la respuesta, recorte o resumen del historial y un tamaño máximo para el mensaje de entrada.
- Un modelo más económico para consultas simples, y caché o respuestas fijas para las preguntas frecuentes.
- Presupuesto con tope mensual y alertas de gasto en el proveedor, y una alarma si el consumo diario pasa de cierto umbral.
- Claves separadas por entorno o por flujo (para poder aislar y revocar), siempre en el servidor y nunca en el navegador, y un CAPTCHA o verificación antes de iniciar el chat.
- En n8n: protección contra bucles (idempotencia, límite de reintentos, detección de duplicados) y registro de los tokens gastados por conversación.

**c) Riesgos de seguridad y protección de datos**

- **Prompt injection.** Alguien intenta que el modelo ignore sus instrucciones, revele el prompt del sistema o ejecute acciones. Lo mitigo separando las instrucciones de lo que escribe el usuario, dándole al modelo solo los permisos y herramientas estrictamente necesarios, validando lo que devuelve, sin poner nunca secretos en el prompt y exigiendo confirmación humana para acciones sensibles.
- **Fuga de datos.** Envío al modelo solo los datos personales imprescindibles (minimización o enmascarado), evito mezclar conversaciones de pacientes distintos y reviso que los logs no guarden información sensible.
- **Ley 1581 de 2012 (Habeas Data).** Los datos de salud son datos sensibles: necesito autorización previa, expresa e informada del titular, una política de tratamiento de datos visible, una finalidad clara y respetar sus derechos a conocer, actualizar, rectificar y suprimir su información, además de registrar la base de datos ante la SIC cuando aplique. El chatbot no debería pedir datos clínicos innecesarios y debe avisar que quien responde es una IA.
- **Terceros y transferencia internacional.** Reviso los términos del proveedor de IA (que no entrene con los datos), el cifrado en tránsito y en reposo, la retención limitada y los acuerdos con los encargados del tratamiento (n8n, ManyChat, el proveedor del modelo).
- **Accesos.** 2FA y control de acceso en n8n y ManyChat, rotación de claves y auditoría de quién consulta las conversaciones.
