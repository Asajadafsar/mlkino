import React from "react";
import {LandingSessionProvider} from "../../Core/Session";
import DesktopNavbar from "./DesktopNavbar";
import MobileBottomNav from "./MobileBottomNav";

export default function Navbar() {
  return (
    <LandingSessionProvider>
      <DesktopNavbar />
      <MobileBottomNav />
    </LandingSessionProvider>
  );
}
