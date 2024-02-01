import React, { forwardRef, RefObject } from "react";
import MenuItem, { MenuItemProps } from "@mui/material/MenuItem";
import { ListItemText } from "@mui/material";

interface IconMenuItemProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  label?: string;
  className?: string;
  MenuItemProps?: MenuItemProps;
  ref?: RefObject<HTMLLIElement>;
}

const IconMenuItem = forwardRef<HTMLLIElement, IconMenuItemProps>(
  function IconMenuItem({ leftIcon, label, MenuItemProps, className, rightIcon, ...props }, ref) {
    return (
      <MenuItem
        {...MenuItemProps}
        ref={ref}
        // className={className}
        {...props}>
        {/* <FlexBox> */}
        {/* <ListItemIcon>{leftIcon}</ListItemIcon> */}
        <ListItemText>{label}</ListItemText>
        {/* </FlexBox> */}
        {rightIcon}
      </MenuItem>
    );
  }
);

export default IconMenuItem;