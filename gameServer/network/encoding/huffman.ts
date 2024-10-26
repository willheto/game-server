class HuffmanNode {
  character: string | null;
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;

  constructor(character: string | null, freq: number) {
    this.character = character;
    this.freq = freq;
    this.left = null;
    this.right = null;
  }
}

function buildHuffmanTree(freqMap: Record<string, number>): HuffmanNode {
  const HuffmanNodes = Object.entries(freqMap).map(
    ([char, freq]) => new HuffmanNode(char, freq)
  );
  HuffmanNodes.sort((a, b) => a.freq - b.freq);

  while (HuffmanNodes.length > 1) {
    const left = HuffmanNodes.shift()!;
    const right = HuffmanNodes.shift()!;
    const newHuffmanNode = new HuffmanNode(null, left.freq + right.freq);
    newHuffmanNode.left = left;
    newHuffmanNode.right = right;
    HuffmanNodes.push(newHuffmanNode);
    HuffmanNodes.sort((a, b) => a.freq - b.freq);
  }

  return HuffmanNodes[0];
}

function buildCodeTable(
  HuffmanNode: HuffmanNode,
  code: string = "",
  codeTable: Record<string, string> = {}
): Record<string, string> {
  if (!HuffmanNode) return codeTable;
  if (HuffmanNode.character) {
    codeTable[HuffmanNode.character] = code;
  }
  buildCodeTable(HuffmanNode.left!, code + "0", codeTable);
  buildCodeTable(HuffmanNode.right!, code + "1", codeTable);
  return codeTable;
}

// Huffman Encoding Function
export function huffmanEncode(input: string): {
  encoded: string;
  codeTable: Record<string, string>;
} {
  const freqMap: Record<string, number> = {};
  for (const char of input) {
    freqMap[char] = (freqMap[char] || 0) + 1;
  }

  const huffmanTree = buildHuffmanTree(freqMap);
  const codeTable = buildCodeTable(huffmanTree);
  const encoded = input
    .split("")
    .map((char) => codeTable[char])
    .join("");

  return { encoded, codeTable };
}
