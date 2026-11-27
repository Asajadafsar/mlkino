import {Suspense} from "react";
import FilesList from "../files/FilesList";

export default function RequestsList() {
  return <Suspense fallback={null}><FilesList kind="request"/></Suspense>;
}
