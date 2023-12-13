import { useContext, useEffect, useMemo, useState } from "react";
// import mouse from '../../../public/right-click-of-the-mouse.png';

export default function Mouse() {
    const mouse = new URL("./right-click-of-the-mouse.png", document.baseURI).href;

        return (
            <div className="mouse-guide">
                <img  src={mouse}/>
            </div>
        );
}