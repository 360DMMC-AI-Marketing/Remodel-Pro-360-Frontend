import { useState } from "react";
import { Button } from "./components/atoms/Button";
import { Plus } from "lucide-react";
import { Container } from "./components/atoms/Container";
import { Card } from "./components/molecules/Card";
import Header from "./components/organisms/Header";
import Footer from "./components/organisms/Footer";

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
    <Header />
    <Container className="">
      <h1 className="text-center p-5">Hello Vite + React!</h1>
      <Card className="flex justify-center">
        <div className="flex flex-col items-center">
          <span className="text-2xl">{count}</span>
          <br />
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCount((count) => count + 1)}
          >
            <Plus />
          </Button>
        </div>
      </Card>
    </Container>
    <Footer />
    </>
  );
}

export default App;
