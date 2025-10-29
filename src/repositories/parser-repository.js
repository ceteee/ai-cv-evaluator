import { PDFParse } from "pdf-parse";

class ParserRepository {
  async getText(file) {
    const dataBuffer = new Uint8Array(file);
    const parser = new PDFParse(dataBuffer);
    const data = await parser.getText();
    const text = data.text;
    return text;
  }
}

export default new ParserRepository();