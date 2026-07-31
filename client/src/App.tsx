import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import ClientApp from "@/pages/app/ClientApp";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <ClientApp />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
