import { useMemo } from "react";
import { useLocation } from "react-router";
import Logo from "../assets/logo.svg";

function getRouteName(route: string) {
  switch(route) {
    case "/":
      return "Drone Management";
    case "/data":
      return "Data Page";
    default: return "";
  }
}

export function Navbar() {
  const currentRoute = useLocation();
  const title = useMemo(() => getRouteName(currentRoute.pathname), [currentRoute.pathname]);
  return (
    <nav className="relative top-0 l-0 w-full h-16 bg-white text-green flex items-center justify-center">
      <img src={Logo} alt="Logo" className="w-32 h-16" />
      <h1 className="text-2xl font-bold ml-4">{title}</h1>
    </nav>
  )
}