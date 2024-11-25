// src/utils/storageUtils.js
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { Buffer } from 'buffer';

// Polyfill for global
if (typeof global === 'undefined') {
  window.global = window;
}

// Polyfill for Buffer
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}

const initializeStorage = (clientId) => {
  return new ThirdwebStorage({
    clientId: clientId,
    gatewayUrls: {
      "ipfs://": [
        `https://${clientId}.ipfscdn.io/ipfs/`,
        "https://ipfs.thirdwebcdn.com/ipfs/",
      ],
    },
  });
};

export const uploadToIpfs = async (file, clientId) => {
  try {
    if (!clientId) {
      throw new Error('Client ID is required for upload');
    }

    console.log('Initializing storage with clientId:', clientId);
    const storage = initializeStorage(clientId);
    
    // Convert File to Blob if needed
    const blob = file instanceof Blob ? file : new Blob([file]);
    
    console.log('Uploading file to IPFS...', blob);
    const uri = await storage.upload(blob, {
      uploadWithGatewayUrl: true,
      uploadWithoutDirectory: true
    });
    
    console.log('File uploaded, URI:', uri);
    
    // Get the gateway URL using the client ID
    const url = uri.replace('ipfs://', `https://${clientId}.ipfscdn.io/ipfs/`);
    console.log('Resolved URL:', url);
    
    return {
      uri,
      url
    };
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
};

export const uploadMetadata = async (imageUri, metadata, clientId) => {
  try {
    if (!clientId) {
      throw new Error('Client ID is required for upload');
    }

    // Validate required fields with proper type checking
    if (!metadata.properties || 
        metadata.properties.score === undefined || 
        metadata.properties.score === null || 
        !metadata.properties.emoji) {
      console.error('Invalid metadata:', metadata);
      throw new Error(`Invalid metadata structure: ${JSON.stringify(metadata.properties)}`);
    }

    console.log('Preparing metadata upload:', metadata);
    const storage = initializeStorage(clientId);
    
    // Ensure all required fields are present and valid
    const processedMetadata = {
      name: metadata.name || 'Imit8 Capture',
      description: metadata.description,
      image: imageUri,
      attributes: [
        {
          trait_type: "Score",
          value: metadata.properties.score
        },
        {
          trait_type: "Emoji",
          value: metadata.properties.emoji
        }
      ],
      properties: {
        score: metadata.properties.score,
        timestamp: metadata.properties.timestamp || new Date().toISOString(),
        wallet: metadata.properties.wallet,
        emoji: metadata.properties.emoji,
        version: '1.1'
      }
    };
    
    console.log('Uploading processed metadata:', processedMetadata);
    const uri = await storage.upload(processedMetadata);
    console.log('Metadata uploaded successfully:', uri);
    return uri;
  } catch (error) {
    console.error("Error uploading metadata:", error);
    throw error;
  }
};