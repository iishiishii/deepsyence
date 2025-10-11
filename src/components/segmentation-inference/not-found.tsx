import { Link } from "@tanstack/react-router";
import { Button } from "@/components/shadcn-ui/button";

const NotFound = () => {
  return (
    <div
      style={{
        alignItems: "center",
        flexDirection: "column",
        zIndex: "1",
        justifySelf: "center",
      }}
      className="w-full h-full"
    >
      404 The page you are looking for was not found.
      <Link to="/">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        >
          Go Back
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
