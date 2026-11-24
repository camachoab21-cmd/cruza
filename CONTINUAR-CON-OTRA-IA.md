# Continuar CRUZA

Trabaja sobre esta rama, que parte de `codex/cruza-expo-24nov` y contiene los cambios locales posteriores. Es una aplicación conceptual para concurso UTS con FastAPI y SQLite: ejecuta `ABRIR-CRUZA.bat`, abre http://127.0.0.1:8765/ y utiliza las credenciales ficticias indicadas en `PRESENTAR-AHORA.md`. GitHub Pages muestra solo una vista estática.

## Encargo prioritario del usuario

El profesor considera que ambos temas se ven apagados: rediseña el portal para que resulte profesional, vistoso, armónico y más vivo. El modo claro necesita más color sin perder legibilidad; el oscuro necesita profundidad y acentos luminosos sin saturación. Conserva el crucigrama, el movimiento escalonado de casillas y colores por palabra, el menú oculto que abre CRUZA, el dibujo exclusivamente sobre fondo libre, las herramientas de lápiz, crayón, borrador, color y gotero, y las fichas de materias.

Proporciona espacios de fondo suficientes para dibujar; la solución actual borra trazos al desplazarse o redimensionar. Considera cómo mantenerlos sin que aparezcan sobre controles, tarjetas o crucigramas. Revisa lag del cursor, movilidad, contraste, accesibilidad y movimiento reducido.

Revisa y rehace el recorrido guiado para un usuario principiante: debe explicar tablero y crucigrama, intersecciones, menú, dibujo y sus herramientas, pensum, filtros y matrícula, conflictos y cambios de grupo, confirmación, horario y ficha de clase, notas y simulador, calendario y agenda, asistencia, historial, perfil, roles y salida. Cada paso debe señalar el control, describir la acción y resultado esperado sin alterar datos automáticamente. Elimina frases de relleno, corrige ortografía y utiliza lenguaje profesional.

Conserva datos ficticios, lógica de matrícula y horarios, roles, notas, servidor y persistencia. Revisa la app completa en ambos temas, escritorio y móvil, con base de prueba aislada; no declares verificado lo que no hayas probado. Informa los problemas y mantén un respaldo antes de cambiar archivos.

## Estado y límites

Ver `CAMBIOS-CRUCIGRAMA-Y-DIBUJO.md`, `RESULTADO-PRUEBA-NOVATO.md`, `INVENTARIO-PRUEBA-USUARIO.md` y `AUDITORIA-EXPOSICION.md`. Son registros de momentos diferentes: las funciones corregidas pueden haber cambiado desde auditorías anteriores. Los tests de Node `qa_*.cjs` contienen rutas absolutas del computador original y puertos locales: adáptalos a tu entorno antes de ejecutarlos. El gotero nativo y todos los dispositivos táctiles no fueron verificados. La versión principal y esta rama están separadas; no sobrescribas trabajo de colaboradores sin revisar.

La aplicación es conceptual y no oficial. Nunca uses datos o contraseñas reales; la base de datos de demostración no se incluye en GitHub.
