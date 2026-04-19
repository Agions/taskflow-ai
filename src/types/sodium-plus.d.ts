/**
 * sodium-plus 类型声明
 */

declare module 'sodium-plus' {
  export class SodiumPlus {
    static auto(): Promise<SodiumPlus>;
    crypto_box_seal(message: Buffer, publicKey: Buffer): Promise<Buffer>;
  }
}
