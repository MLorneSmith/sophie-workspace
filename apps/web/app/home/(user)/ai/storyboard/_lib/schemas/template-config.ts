export interface TemplateLayout {
	slideWidth: number;
	slideHeight: number;
	titlePosition: Position;
	sectionPosition: Position;
	defaultContentPosition: Position;
	contentTitlePosition: Position;
	subheadlinePosition: Position;
	twoColumnLeft: Position;
	twoColumnRight: Position;
	imageTextImage: Position;
	imageTextText: Position;
	textImageText: Position;
	textImageImage: Position;
	comparisonLeft: Position;
	comparisonRight: Position;
	chartPosition: Position;
	bulletListPosition: Position;
	titleContentPosition: Position;
	sectionContentPosition: Position;
	twoColumnSubheadlineLeft: Position;
	twoColumnSubheadlineRight: Position;
	imageTextSubheadline: Position;
	textImageSubheadline: Position;
	titleSubheadlinePosition: Position;
	footerPosition: Position;
	showPageNumbers: boolean;
	footer: {
		enabled: boolean;
	};
}

interface Position {
	x: number | string;
	y: number | string;
	w: number | string;
	h: number | string;
}

export interface TemplateConfig {
	name: string;
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		bodyText: string;
		headingText: string;
		subheadingText: string;
		mutedText: string;
		error: string;
		bullet: string;
		footerText: string;
	};
	typography: {
		fontFamily: string;
		titleFontSize: number;
		sectionFontSize: number;
		headlineFontSize: number;
		subheadlineFontSize: number;
		bodyFontSize: number;
		bulletFontSize: number;
		subbulletFontSize: number;
		tableFontSize: number;
		footerFontSize: number;
		minFontSize: number;
		maxFontSize: number;
	};
	layout: TemplateLayout;
	charts: {
		colors: string[];
		showTitle: boolean;
		showLegend: boolean;
		legendPosition: string;
		dataLabelPosition: string;
		showDataLabels: boolean;
		roundedCorners: boolean;
	};
}
