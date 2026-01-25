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

    //% block="enable sprite rotation input protection"
    //% weight=75
    export function enableInputProtection(): void {
        inputProtectionEnabled = true;
    }

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
    export function rotateTowardsWithOffset(sprite1: Sprite, sprite2: Sprite, offset: number): void {
        if (!sprite1 || !sprite2) return;
        const deltaX = sprite2.x - sprite1.x;
        const deltaY = sprite2.y - sprite1.y;
        const angleRadians = Math.atan2(deltaY, deltaX);
        const angleDegrees = angleRadians * (180 / Math.PI) + offset;
        setRotation(sprite1, angleDegrees);
    }

    //% block="continuously make %sprite1=variables_get(mySprite) rotate towards %sprite2=variables_get(mySprite2) with offset %offset degrees"
    //% weight=79
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

    function applyTransformation(sprite: Sprite, data: SpriteRotationData): void {
        const currentX = sprite.x;
        const currentY = sprite.y;
        let transformedImage = data.originalImage.clone();

        if (data.isFlippedY) {
            transformedImage = flipImageVertically(transformedImage);
        }

        if (data.currentRotation !== 0) {
            transformedImage = rotateImage(transformedImage, data.currentRotation);
        }

        data.transformedImage = transformedImage;

        sprite.setImage(transformedImage);
        sprite.setPosition(currentX, currentY);
    }

    function flipImageVertically(img: Image): Image {
        const width = img.width;
        const height = img.height;
        const flippedImg = image.create(width, height);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const color = img.getPixel(x, y);
                flippedImg.setPixel(x, height - 1 - y, color);
            }
        }
        return flippedImg;
    }

    function rotateImage(img: Image, angleDegrees: number): Image {
        const angleRadians = angleDegrees * Math.PI / 180;
        const cos = Math.cos(angleRadians);
        const sin = Math.sin(angleRadians);
        const width = img.width;
        const height = img.height;
        const newWidth = Math.ceil(Math.abs(width * cos) + Math.abs(height * sin));
        const newHeight = Math.ceil(Math.abs(width * sin) + Math.abs(height * cos));
        const rotatedImg = image.create(newWidth, newHeight);
        const centerX = width / 2;
        const centerY = height / 2;
        const newCenterX = newWidth / 2;
        const newCenterY = newHeight / 2;

        for (let x = 0; x < newWidth; x++) {
            for (let y = 0; y < newHeight; y++) {
                const translatedX = x - newCenterX;
                const translatedY = y - newCenterY;
                const sourceX = Math.round(translatedX * cos + translatedY * sin + centerX);
                const sourceY = Math.round(-translatedX * sin + translatedY * cos + centerY);

                if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
                    const color = img.getPixel(sourceX, sourceY);
                    if (color !== 0) {
                        rotatedImg.setPixel(x, y, color);
                    }
                }
            }
        }
        return rotatedImg;
    }
}
