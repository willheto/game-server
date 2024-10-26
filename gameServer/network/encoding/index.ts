import { huffmanEncode } from "./huffman";

export function encodeGameState(gameState: any): {
  encoded: string;
  codeTable: Record<string, string>;
} {
  const jsonString = JSON.stringify(gameState);
  const { encoded, codeTable } = huffmanEncode(jsonString);
  
  return { encoded, codeTable };
}
