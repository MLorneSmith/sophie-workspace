"use client";

import { useState } from "react";

import Image, { type ImageProps } from "next/image";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad"> {
	src: string;
	alt: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
	src,
	alt,
	className,
	priority,
	...props
}) => {
	const [isLoading, setIsLoading] = useState(!priority); // Don't show loading state if priority

	return (
		<div className="relative overflow-hidden rounded-lg">
			<Image
				src={src}
				alt={alt}
				className={`transition-all duration-1000 ease-in-out ${isLoading ? "opacity-0" : "opacity-100"} ${className || ""} `}
				{...props}
				priority={priority}
				onLoad={() => setIsLoading(false)}
			/>
		</div>
	);
};

export default OptimizedImage;
