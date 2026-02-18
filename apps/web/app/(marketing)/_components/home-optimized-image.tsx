"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const BLUR_PLACEHOLDER =
	"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciBpZD0iYiI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMjAiLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2IpIiBmaWxsPSIjMWExYTI1Ii8+PC9zdmc+";

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
	const [isLoading, setIsLoading] = useState(!priority);

	return (
		<div className="relative overflow-hidden rounded-lg">
			<Image
				src={src}
				alt={alt}
				className={`transition-all duration-1000 ease-in-out ${isLoading ? "opacity-0" : "opacity-100"} ${className || ""} `}
				{...props}
				priority={priority}
				placeholder="blur"
				blurDataURL={BLUR_PLACEHOLDER}
				onLoad={() => setIsLoading(false)}
			/>
		</div>
	);
};

export default OptimizedImage;
