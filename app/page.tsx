import CodeGenerator from "@/components/code-generator"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center mb-6">Yet Another Mechanisms Generator</h1>
        <p className="text-center text-muted-foreground mb-8">
          Asansör, kol ve pivot alt sistemleri için komut tabanlı Java kodu oluşturun
        </p>
        <CodeGenerator />
      </div>
    </main>
  )
}
