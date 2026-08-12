# Dojo Tokon

Dojo Tokon es un entrenador educativo y local de combos para juegos de lucha. Este MVP enseña y evalúa la secuencia `L → M → H → DOWN+H`, representada visualmente como `□ → △ → ○ → ↓ + ○`. No usa personajes, marcas ni recursos oficiales de ningún videojuego.

La aplicación funciona con HTML, CSS y JavaScript vanilla. No tiene backend, cuentas, analytics ni requests a servicios externos. El progreso se guarda únicamente en `localStorage` del dispositivo.

## Jugar online

La versión publicada mediante GitHub Pages está disponible en:

**https://sumonteh.github.io/dojo-tokon/**

GitHub Pages sirve el sitio por HTTPS, por lo que permite registrar el Service Worker e instalar la PWA en navegadores compatibles.

## Cómo ejecutarlo

La aplicación necesita servirse por HTTP para que los módulos JavaScript, el manifest y el Service Worker funcionen correctamente. Desde esta carpeta:

```bash
python -m http.server 8000 --bind 0.0.0.0
```

Si el comando `python` no existe, prueba `python3` o `py` con los mismos argumentos. Abre `http://localhost:8000` en el navegador del computador. No abras `index.html` directamente como archivo.

## Probarlo desde PC o Mac

1. Levanta el servidor y abre `http://localhost:8000`.
2. Elige LEARN, PRACTICE o CHALLENGE.
3. Ejecuta `J`, `K`, `L`, y después mantén `S` mientras pulsas `L`.
4. Para mostrar los controles en pantalla con mouse, pulsa **CONTROLES**.

## Abrirlo desde un celular en la misma Wi‑Fi

El computador y el teléfono deben estar en la misma red.

1. Levanta el servidor con `--bind 0.0.0.0`.
2. Busca la IP local del computador:
   - Windows: ejecuta `ipconfig` y busca la dirección IPv4 del adaptador Wi‑Fi.
   - macOS: revisa Ajustes del Sistema → Wi‑Fi → Detalles, o ejecuta `ipconfig getifaddr en0`.
   - Linux: ejecuta `hostname -I`.
3. En Safari o Chrome del celular abre `http://IP-DEL-PC:8000`, sustituyendo `IP-DEL-PC` por esa IPv4.
4. Si no carga, permite a Python atravesar el firewall para redes privadas y confirma que ambos dispositivos estén en la misma Wi‑Fi.
5. Gira el teléfono a horizontal. La vista landscape prioriza pelea, objetivo y controles para pulgares.

Nota: iOS considera seguro `localhost` pero no siempre una dirección HTTP de red local. La aplicación se puede probar por HTTP, pero la instalación PWA, Service Worker y algunas APIs pueden exigir HTTPS según la versión de Safari. Una vez instalada/cargada en un contexto seguro, el App Shell queda preparado para abrir offline.

## Controles de teclado

| Acción | Tecla |
| --- | --- |
| Arriba / abajo / izquierda / derecha | `W A S D` o flechas |
| Light (`□`) | `J` |
| Medium (`△`) | `K` |
| Heavy (`○`) | `L` |
| Assist (`×`) | `I` |
| Launcher (`↓ + ○`) | Mantener `S` o `↓` y pulsar `L` |

## Controles táctiles

El D-pad está a la izquierda y los cuatro botones de acción a la derecha. Se usan Pointer Events con un identificador independiente por dedo, por lo que se puede mantener `↓` y tocar `○` simultáneamente. Los botones muestran un estado presionado, evitan selección de texto y la zona de juego evita scroll accidental.

## Probar un gamepad

1. Conecta o empareja el mando antes o después de abrir la app.
2. Pulsa un botón para que el navegador lo active.
3. El indicador superior cambia a **GAMEPAD CONECTADO**.
4. En mandos con mapping estándar se intentan usar D-pad y cuatro botones de cara: botón izquierdo = Light, superior = Medium, derecho = Heavy e inferior = Assist.

La Gamepad API varía entre navegadores y mandos. La capa `GamepadController` está aislada para poder incorporar mappings configurables más adelante. Si Safari/iOS no expone la API, teclado y táctil siguen funcionando.

## Instalar en pantalla de inicio

- Chrome/Edge/Android: usa la opción **Instalar aplicación** o **Agregar a pantalla de inicio** del menú.
- Safari/iPhone: Compartir → **Agregar a pantalla de inicio**.

El manifest incluye nombre, colores e iconos propios. El Service Worker almacena el App Shell después de la primera carga servida desde un contexto admitido por el navegador.

## Modos

- **LEARN:** muestra sólo el siguiente input y no penaliza el timing.
- **PRACTICE:** muestra la secuencia completa, valida orden y ventanas de tiempo.
- **CHALLENGE:** oculta la secuencia durante el intento y presenta estadísticas al terminar.

## Estructura

```text
index.html                 Interfaz y accesibilidad
css/styles.css             Diseño desktop, tablet y móvil
data/combos.js             Combos y constantes de timing
js/input-manager.js        Normalización central de entradas
js/keyboard.js             Adaptador de teclado
js/touch-controls.js       Adaptador Pointer Events multitouch
js/gamepad.js              Adaptador Gamepad API
js/combo-engine.js         Motor genérico de secuencia y timing
js/fighter.js              Personajes y animaciones Canvas 2D
js/ui.js                   Render de feedback, historial y estadísticas
js/storage.js              Progreso local
js/haptics.js              Vibración opcional
js/sound.js                Efectos sintetizados opcionales
js/app.js                  Composición de la aplicación
manifest.webmanifest       Configuración PWA
service-worker.js          Caché offline básico
assets/icons/              Iconos placeholder propios
```

## Agregar nuevos combos

Añade otra definición al array `COMBOS` en `data/combos.js`:

```js
{
  id: "otro-combo",
  name: "Another Combo",
  displayName: "Otro combo",
  sequence: [
    { input: "L" },
    { input: "H" },
    { input: "DOWN+H" }
  ]
}
```

El motor no contiene pasos específicos del combo. En este MVP la app selecciona `COMBOS[0]`; una futura pantalla de selección podrá elegir cualquier definición sin cambiar el motor.

## Cambiar las ventanas de timing

Edita `TIMING` en `data/combos.js`:

- `PERFECT_MIN` / `PERFECT_MAX`: rango PERFECT.
- `GOOD_MIN` / `GOOD_MAX`: rango GOOD.
- Fuera de GOOD, pero antes del límite: TOO EARLY o TOO LATE.
- `MAX_COMBO_GAP`: demora máxima antes de COMBO DROPPED.

Los valores están en milisegundos y son educativos; no intentan reproducir timings de ningún juego comercial.

## Limitaciones actuales

- Incluye un solo combo y un único perfil genérico de gamepad estándar.
- No hay selector de combos ni remapeo visual de controles todavía.
- Los personajes son stickman y las colisiones son animaciones didácticas, no física de combate.
- La instalación/offline en un iPhone accediendo por IP local puede estar restringida por la política de contexto seguro de Safari.
- Los sonidos se generan con Web Audio y empiezan desactivados.

## Ideas para v0.2

- Selector de combos y categorías de dificultad.
- Calibración de timing y perfiles de mapping por gamepad.
- Entrenamiento de confirmaciones, links y rutas alternativas.
- Modo de accesibilidad con tamaños y contrastes configurables.
- Exportación/importación local de progreso.

Estas ideas no forman parte del MVP actual.
