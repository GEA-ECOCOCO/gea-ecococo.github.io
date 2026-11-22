# Voz de bienvenida (opcional, la mejor calidad)

El sitio ya habla con la voz femenina del teléfono. Para que suene siempre igual, natural y de marca, genera estos dos archivos y súbelos a esta carpeta con exactamente estos nombres:

- `bienvenida-es.mp3`  → "Bienvenido a... Jea... Eco Coco."
- `bienvenida-en.mp3`  → "Welcome to... Jea... Eco Coco."

Si existen, el sitio los usa solos (no hay que tocar código). MP3 mono, unos 2 a 3 segundos, menos de 100 KB.

## Opción gratis con voz de Guatemala (Microsoft Neural)

    pip install edge-tts
    edge-tts --voice es-GT-MartaNeural --rate=-18% --pitch=+2Hz --text "Bienvenido a... Jea... Eco Coco." --write-media bienvenida-es.mp3
    edge-tts --voice en-US-AvaNeural   --rate=-15% --text "Welcome to... Jea... Eco Coco." --write-media bienvenida-en.mp3

## Con Azure Speech u otro servicio que acepte SSML

    <speak version="1.0" xml:lang="es-GT">
      <voice name="es-GT-MartaNeural">
        <prosody rate="-18%" pitch="+2%">Bienvenido a<break time="250ms"/>Jea<break time="200ms"/>Eco Coco.</prosody>
      </voice>
    </speak>

Se pronuncia "Jea" y "Eco Coco" (separado), para que no deletree las letras.
