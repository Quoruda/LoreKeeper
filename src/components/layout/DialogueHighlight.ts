import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Node } from '@tiptap/pm/model';

// Plugin ProseMirror pour surligner dynamiquement tout ce qui est entre guillemets
// Cela s'applique uniquement à l'affichage (WYSIWYG) sans modifier le fichier Markdown !
export const DialogueHighlight = Extension.create({
    name: 'dialogueHighlight',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('dialogueHighlight'),
                state: {
                    init: (_, { doc }) => getDecorations(doc),
                    apply: (transaction, oldState) => {
                        // On recalcule uniquement quand le document change
                        if (!transaction.docChanged) {
                            return oldState.map(transaction.mapping, transaction.doc);
                        }
                        return getDecorations(transaction.doc);
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                },
            }),
        ];
    },
});

function getDecorations(doc: Node) {
    const decorations: Decoration[] = [];

    doc.descendants((node, pos) => {
        if (!node.isText) return;

        const text = node.text || '';
        // Regex pour attraper les dialogues :
        // - Entre guillemets français « »
        // - Entre guillemets droits " "
        // - Entre guillemets anglais “ ”
        const regex = /«[^»]+»|"[^"]+"|“[^”]+”/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            decorations.push(
                Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                    class: 'text-[#63b3ed] bg-[#2b6cb0]/15 italic px-0.5 rounded transition-colors', // Bleu "Narration/Dialogue"
                })
            );
        }
    });

    return DecorationSet.create(doc, decorations);
}
