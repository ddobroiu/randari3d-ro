import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Suspense, useEffect, useState } from "react";
import JSZip from "jszip";

function Model({ url }: { url: string }) {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        if (!url || typeof url !== "string") throw new Error("URL invalid sau lipsă.");
        if (url.startsWith("blob:")) {
          setLocalUrl(url);
        } else {
          const res = await fetch(url);
          const contentType = res.headers.get("content-type");

          if (!res.ok || contentType?.includes("text/html")) {
            throw new Error("Fișierul primit nu este un .glb valid.");
          }

          const blob = await res.blob();
          const objUrl = URL.createObjectURL(blob);
          if (active) setLocalUrl(objUrl);
        }
      } catch (err: any) {
        console.error("❌ Eroare la încărcarea modelului:", err.message);
        setError(err.message);
      }
    };

    load();

    return () => {
      active = false;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [url]);

  if (error) {
    return (
      <Html center>
        <div className="text-red-500 bg-black bg-opacity-50 p-2 rounded">
          {error}
        </div>
      </Html>
    );
  }

  if (!localUrl) {
    return (
      <Html center>
        <div className="text-white animate-pulse">🔄 Se încarcă modelul...</div>
      </Html>
    );
  }

  const gltf = useLoader(GLTFLoader, localUrl);
  return <primitive object={gltf.scene} />;
}

export default function ModelViewer({ url, videoUrl }: { url: string; videoUrl?: string }) {
  const [lighting, setLighting] = useState("city");
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadZip = async () => {
    if (!url) return;
    setDownloading(true);
    const zip = new JSZip();

    try {
      const modelBlob = await fetch(url).then((res) => res.blob());
      zip.file("model.glb", modelBlob);

      if (videoUrl) {
        const videoBlob = await fetch(videoUrl).then((res) => res.blob());
        zip.file("preview.mp4", videoBlob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "model3d.zip";
      link.click();
    } catch (err) {
      console.error("Eroare la descărcare arhivă:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full h-[500px] rounded overflow-hidden">
        <Canvas
          shadows
          camera={{ position: [0, 0, 3], fov: 50 }}
          style={{ filter: `brightness(${brightness}) contrast(${contrast})` }}
        >
          <ambientLight intensity={1} />
          <directionalLight position={[0, 10, 5]} intensity={1} />
          <Suspense fallback={<Html center>🔃 Loading...</Html>}>
            <Environment preset={lighting as any} />
            <Model url={url} />
            <OrbitControls enableZoom enablePan enableRotate autoRotate autoRotateSpeed={2} />
          </Suspense>
        </Canvas>
      </div>

      {/* CONTROALE + DOWNLOAD */}
      <div className="mt-4 bg-gray-800 p-4 rounded shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Lighting</label>
            <select
              value={lighting}
              onChange={(e) => setLighting(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
            >
              <option value="city">City</option>
              <option value="sunset">Sunset</option>
              <option value="dawn">Dawn</option>
              <option value="warehouse">Warehouse</option>
              <option value="forest">Forest</option>
              <option value="apartment">Apartment</option>
              <option value="studio">Studio</option>
              <option value="night">Night</option>
              <option value="park">Park</option>
              <option value="lobby">Lobby</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Brightness</label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contrast</label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleDownloadZip}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={downloading}
          >
            {downloading ? "Se generează arhiva..." : "Descarcă arhivă ZIP"}
          </button>
        </div>
      </div>

      {/* VIDEO DEDESUBT */}
      {videoUrl && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Video Generat</h3>
          <video src={videoUrl} controls className="w-full rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  );
}
