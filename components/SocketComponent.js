import { useEffect } from "react";
import io from "socket.io-client";

const SocketComponent = () => {
  useEffect(() => {
    const socket = io("http://15.188.53.144:80");

    socket.on("imageUpdated", (index) => {
      console.log("Received updated image index:", index);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null;
};

export default SocketComponent;
