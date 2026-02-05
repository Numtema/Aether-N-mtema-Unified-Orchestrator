# Aether Nexus - Firestore Security Rules (VERSION CORRIGÉE)

Copiez et collez ce code dans l'onglet **Rules** de Firestore.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function uid() { return request.auth.uid; }
    function isOwner(data) { return signedIn() && data.ownerId == uid(); }

    // Par défaut, tout est interdit
    match /{document=**} { allow read, write: if false; }

    // PROFIL UTILISATEUR
    match /users/{userId} {
      allow read, write: if signedIn() && uid() == userId;
    }

    // PROJETS (C'était la règle manquante !)
    match /projects/{projectId} {
      allow read, update, delete: if signedIn() && resource.data.ownerId == uid();
      allow create: if signedIn() && request.resource.data.ownerId == uid();
    }

    // MISSIONS / FLOWS
    match /flows/{flowId} {
      allow read, update, delete: if signedIn() && resource.data.ownerId == uid();
      allow create: if signedIn() && request.resource.data.ownerId == uid();
    }

    // TÂCHES
    match /tasks/{taskId} {
      allow read, update, delete: if signedIn() && resource.data.ownerId == uid();
      allow create: if signedIn() && request.resource.data.ownerId == uid();
    }

    // AGENTS
    match /agents/{agentId} {
      allow read: if signedIn() && (resource.data.ownerId == uid() || resource.data.isPublic == true);
      allow write: if signedIn() && resource.data.ownerId == uid();
      allow create: if signedIn() && request.resource.data.ownerId == uid();
    }

    // MCP CONFIGS
    match /mcpConfigs/{configId} {
      allow read, write: if signedIn() && resource.data.ownerId == uid();
      allow create: if signedIn() && request.resource.data.ownerId == uid();
    }
  }
}
```
