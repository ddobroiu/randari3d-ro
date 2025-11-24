import { Canvas, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { OrbitControls } from "@react-three/drei";

export default function Panorama({ image = "/panorama.jpg" }) {
  const texture = useLoader(TextureLoader, image);

  return (
    <div style={{ width: "100%", height: "350px", borderRadius: "18px", overflow: "hidden", marginBottom: "2rem" }}>
      <Canvas camera={{ fov: 75, position: [0, 0, 0.1] }}>
        <mesh>
          <sphereGeometry args={[500, 60, 40]} />
          <meshBasicMaterial map={texture} side={2} />
        </mesh>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
