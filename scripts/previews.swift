// Renders the first two pages of every public/reports/*.pdf to
// public/reports/previews/<name>-1.jpg and <name>-2.jpg (used by the Reports hover preview).
// macOS only (PDFKit). Run with: npm run previews
import AppKit
import PDFKit

let reports = URL(fileURLWithPath: "public/reports")
let out = reports.appendingPathComponent("previews")
try FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)

let width: CGFloat = 600
let pdfs = try FileManager.default.contentsOfDirectory(at: reports, includingPropertiesForKeys: nil)
  .filter { $0.pathExtension.lowercased() == "pdf" }

for pdf in pdfs {
  guard let doc = PDFDocument(url: pdf) else { continue }
  let name = pdf.deletingPathExtension().lastPathComponent
  for index in 0..<min(2, doc.pageCount) {
    guard let page = doc.page(at: index) else { continue }
    let box = page.bounds(for: .mediaBox)
    let image = page.thumbnail(of: NSSize(width: width, height: width * box.height / box.width), for: .mediaBox)
    guard let tiff = image.tiffRepresentation,
      let jpeg = NSBitmapImageRep(data: tiff)?.representation(using: .jpeg, properties: [.compressionFactor: 0.8])
    else { continue }
    try jpeg.write(to: out.appendingPathComponent("\(name)-\(index + 1).jpg"))
  }
  print("\(name): \(doc.pageCount) pages")
}
