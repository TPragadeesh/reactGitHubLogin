import React, { useState } from "react";
import { display } from "./App";
import { Button, ListItem } from "@chakra-ui/react";

interface Props {
  file: display;
  onClick: (funct: {
    name: string;
    path: string;
    sha: string;
    type: string;
    url: string;
  }) => void;
}
const Directory = ({ file, onClick }: Props) => {
  const [isExpanded, toggleExpanded] = useState(false);

  if (file.type === "blob") {
    return (
      <>
        <ListItem>
          <Button className="file-name" onClick={() => onClick(file)}>
            {file.name}
          </Button>
        </ListItem>
      </>
    );
  }
  return (
    <div className="folder">
      <ListItem>
        <Button
          className="folder-title"
          onClick={() => toggleExpanded(!isExpanded)}
        >
          {file.name}
        </Button>
      </ListItem>
      {isExpanded &&
        file.items?.map((item, i) => (
          <Directory onClick={onClick} file={item} key={i} />
        ))}
    </div>
  );
};

export default Directory;
