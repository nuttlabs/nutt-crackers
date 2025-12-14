/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import Papa from 'papaparse';

export default {

	async fetch(request, env, ctx): Promise<Response> {

		let finalResponse: Response;

		const reqURL = new URL(request.url);
		const reqOrigin = reqURL.origin;

		const productData: Product[] = await prepProductData();

		const finalHTML = await prepHTML(env, reqOrigin, productData);

		return new Response(finalHTML, {
			headers: { 'content-type': 'text/html' }
		});
	}

} satisfies ExportedHandler<Env>;

async function prepProductData(): Promise<Product[]> {

	const csvResp = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vS3ztjFwLSFI5nz7BpYb96HUNK0USnu0Ia9ISwvsaHwoviNYtirgYay-Tmzeg-QnOknmB0GYoro3wwq/pub?gid=1140861820&single=true&output=csv');
	const csvText = await csvResp.text();
	return Papa.parse(csvText, {header: true}).data as Product[];

}

async function prepHTML(env: Env, reqOrigin: string, productData: Product[]) {

	const layoutResp = await env.ASSETS.fetch(reqOrigin + '/html/layout.html');
	const layoutHTML = await layoutResp.text();
	const productResp = await env.ASSETS.fetch(reqOrigin + '/html/product.html');
	const productHTML = await productResp.text();

	const galleryHTML = productData.map(product => {
		return productHTML
			.replace('{{imgURL}}', product.Photo)
			.replaceAll('{{descriptor}}', product.Descriptor)
			.replace('{{categories}}', product.Categories)
			.replace('{{brand}}', product.Brand)
			.replace('{{productURL}}', product["Product URL"])
			.replace('{{startingPrice}}', product["Starting Price"]);
	}).join('');

	return layoutHTML.replace('{{products}}', galleryHTML);

}

interface Product {
	Brand: string;
	Categories: string;
	Descriptor: string;
	Photo: string;
	"Product URL": string;
	"Starting Price": string;
}