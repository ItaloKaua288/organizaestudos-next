export function fixEncoding(text: string) {
    return new TextDecoder("utf-8").decode(
        Uint8Array.from(text, c => c.charCodeAt(0))
    );
}