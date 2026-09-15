import "./matches.css";
import MatchCenterGuard from "./MatchCenterGuard";

export default function MatchesLayout({ children }) {
  return (
    <>
      {children}
      <MatchCenterGuard />
    </>
  );
}
