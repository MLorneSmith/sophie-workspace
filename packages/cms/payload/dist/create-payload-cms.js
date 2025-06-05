/**
 * Creates a new Payload client instance.
 */
export async function createPayloadClient() {
    const { PayloadClient } = await import("./payload-client");
    return new PayloadClient();
}
