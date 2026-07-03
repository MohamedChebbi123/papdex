export function encodeEmbedding(vector: readonly number[]): Buffer {
    return Buffer.from(Float32Array.from(vector).buffer)
}

export function decodeEmbedding(buffer: Buffer): number[] {
    // Copy into a freshly-aligned buffer first: a Buffer read back from
    // better-sqlite3 may have a byteOffset that isn't a multiple of 4,
    // which Float32Array's view constructor requires.
    const aligned = new Uint8Array(buffer.byteLength)
    aligned.set(buffer)
    return Array.from(new Float32Array(aligned.buffer))
}
