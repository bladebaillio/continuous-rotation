//% weight=100 color=#ff6600 icon="\uf021"
namespace Rotation {
    interface SpriteRotationData {
        originalImage: Image;
        currentRotation: number;
        isFlippedY: boolean;
        transformedImage?: Image;
    }

    const spriteData: { [key: number]: SpriteRotationData } = {};

    let lastValidLeftState = false;
    let lastValidRightState = false;
    let inputProtectionEnabled = false;

    function shouldProcessTransformation(): boolean {
        if (!inputProtectionEnabled) return true;

        let leftPressed = controller.left.isPressed();
        let rightPressed = controller.right.isPressed();

        if (leftPressed && rightPressed) {
            return false;
        }

        if (leftPressed && !rightPressed) {
            lastValidLeftState = true;
            lastValidRightState = false;
        } else if (rightPressed && !leftPressed) {
            lastValidLeftState = false;
            lastValidRightState = true;
        }

        return true;
    }

    //% block="set %sprite=variables_get(mySprite) rotation to %angle degrees"
    //% weight=100
    //% group="Sprites"
    export function setRotation(sprite: Sprite, angle: number): void {
        if (!sprite) return;
        const spriteId = sprite.id;

        if (!spriteData[spriteId]) {
            spriteData[spriteId] = {
                originalImage: sprite.image.clone(),
                currentRotation: 0,
                isFlippedY: false
            };
        }

        const data = spriteData[spriteId];
        const normalizedAngle = ((angle % 360) + 360) % 360;

        if (data.currentRotation !== normalizedAngle) {
            data.currentRotation = normalizedAngle;
            applyTransformation(sprite, data);
        }
    }

    //% block="set %sprite=variables_get(mySprite) vertical flip %flipped"
    //% weight=95
    //% group="Sprites"
    export function setVerticalFlip(sprite: Sprite, flipped: boolean): void {
        if (!sprite) return;

        if (!shouldProcessTransformation()) {
            return;
        }

        const spriteId = sprite.id;

        if (!spriteData[spriteId]) {
            spriteData[spriteId] = {
                originalImage: sprite.image.clone(),
                currentRotation: 0,
                isFlippedY: false
            };
        }

        const data = spriteData[spriteId];

        if (data.isFlippedY !== flipped) {
            data.isFlippedY = flipped;
            applyTransformation(sprite, data);
        }
    }

    //% block="make %sprite1=variables_get(mySprite) rotate towards %sprite2=variables_get(mySprite2) with offset %offset degrees"
    //% weight=89
    //% group="Sprites"
    export function rotateTowardsWithOffset(sprite1: Sprite, sprite2: Sprite, offset: number): void {
        if (!sprite1 || !sprite2) return;
        const dx = sprite2.x - sprite1.x;
        const dy = sprite2.y - sprite1.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + offset;
        setRotation(sprite1, angle);
    }

    //% block="continuously make %sprite1=variables_get(mySprite) rotate towards %sprite2=variables_get(mySprite2) with offset %offset degrees"
    //% weight=79
    //% group="Sprites"
    export function continuouslyRotateTowardsWithOffset(sprite1: Sprite, sprite2: Sprite, offset: number): void {
        if (!sprite1 || !sprite2) return;
        rotateTowardsWithOffset(sprite1, sprite2, offset);

        game.onUpdate(() => {
            if (!sprite1 || !sprite2) return;
            rotateTowardsWithOffset(sprite1, sprite2, offset);
        });
    }

    //% block="get rotated image of %sprite=variables_get(mySprite)"
    //% weight=70
    //% group="Sprites"
    export function getRotatedImage(sprite: Sprite): Image {
        if (!sprite) return null;
        const data = spriteData[sprite.id];
        if (data && data.transformedImage) {
            return data.transformedImage.clone();
        }

        let src = data ? data.originalImage.clone() : sprite.image.clone();
        if (data && data.isFlippedY) src = flipImageVertically(src);
        if (data && data.currentRotation !== 0) src = rotateImage(src, data.currentRotation);
        return src;
    }

    //% block="rotate image %img=variables_get(myImage) by %angle degrees with %margin pixel margin"
    //% weight=60
    //% group="Images"
    export function rotateImageByDegrees(
        img: Image,
        angle: number,
        margin: number
    ): Image {
        if (!img) return null;
        const a = ((angle % 360) + 360) % 360;
        return rotateImageWithMargin(img, a, Math.max(0, margin));
    }

    //% block="rotate image %img=variables_get(myImage) from x %x1 y %y1 to face x %x2 y %y2 with offset %offset degrees with %margin pixel margin"
    //% weight=55
    //% group="Images"
    export function rotateImageFromToWithOffset(
        img: Image,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        offset: number,
        margin: number
    ): Image {
        if (!img) return null;

        const dx = x2 - x1;
        const dy = y2 - y1;
        if (dx === 0 && dy === 0) return img.clone();

        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + offset;
        return rotateImageWithMargin(img, angle, Math.max(0, margin));
    }

    //% block="enable sprite rotation input protection"
    //% weight=75
    //% group="Other"
    export function enableInputProtection(): void {
        inputProtectionEnabled = true;
    }


    function applyTransformation(sprite: Sprite, data: SpriteRotationData): void {
        const x = sprite.x;
        const y = sprite.y;

        let img = data.originalImage.clone();
        if (data.isFlippedY) img = flipImageVertically(img);
        if (data.currentRotation !== 0) img = rotateImage(img, data.currentRotation);

        data.transformedImage = img;
        sprite.setImage(img);
        sprite.setPosition(x, y);
    }

    function flipImageVertically(img: Image): Image {
        const w = img.width;
        const h = img.height;
        const out = image.create(w, h);

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                out.setPixel(x, h - 1 - y, img.getPixel(x, y));
            }
        }
        return out;
    }

    function rotateImage(img: Image, angleDegrees: number): Image {
        const r = angleDegrees * Math.PI / 180;
        const cos = Math.cos(r);
        const sin = Math.sin(r);

        const w = img.width;
        const h = img.height;

        const nw = Math.ceil(Math.abs(w * cos) + Math.abs(h * sin));
        const nh = Math.ceil(Math.abs(w * sin) + Math.abs(h * cos));

        const out = image.create(nw, nh);

        const cx = w / 2;
        const cy = h / 2;
        const ncx = nw / 2;
        const ncy = nh / 2;

        for (let x = 0; x < nw; x++) {
            for (let y = 0; y < nh; y++) {
                const dx = x - ncx;
                const dy = y - ncy;

                const sx = Math.round(dx * cos + dy * sin + cx);
                const sy = Math.round(-dx * sin + dy * cos + cy);

                if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
                    const c = img.getPixel(sx, sy);
                    if (c !== 0) out.setPixel(x, y, c);
                }
            }
        }
        return out;
    }

    function rotateImageWithMargin(img: Image, angleDegrees: number, margin: number): Image {
        const r = angleDegrees * Math.PI / 180;
        const cos = Math.cos(r);
        const sin = Math.sin(r);

        const sw = img.width;
        const sh = img.height;

        const dw = sw + margin * 2;
        const dh = sh + margin * 2;

        const out = image.create(dw, dh);

        const scx = sw / 2;
        const scy = sh / 2;
        const dcx = dw / 2;
        const dcy = dh / 2;

        for (let x = 0; x < dw; x++) {
            for (let y = 0; y < dh; y++) {
                const dx = x - dcx;
                const dy = y - dcy;

                const sx = Math.round(dx * cos + dy * sin + scx);
                const sy = Math.round(-dx * sin + dy * cos + scy);

                if (sx >= 0 && sx < sw && sy >= 0 && sy < sh) {
                    const c = img.getPixel(sx, sy);
                    if (c !== 0) out.setPixel(x, y, c);
                }
            }
        }
        return out;
    }
}
