package com.university.user.service;

import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.springframework.stereotype.Service;

import jakarta.ws.rs.core.Response;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class KeycloakService {

    private final Keycloak keycloak;
    private final String realmName = "medical-realm";

    public String registerUserInKeycloak(String username, String email, String fullName, String password, String roleName) {
        String[] nameParts = fullName.split(" ", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        UserRepresentation user = new UserRepresentation();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(true);
        user.setEmailVerified(true);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);
        credential.setTemporary(false);
        user.setCredentials(Collections.singletonList(credential));

        UsersResource usersResource = keycloak.realm(realmName).users();

        try (Response response = usersResource.create(user)) {
            if (response.getStatus() != 201) {
                throw new RuntimeException("Error creating user in Keycloak! Status code: " + response.getStatus());
            }

            String path = response.getLocation().getPath();
            String keycloakUserId = path.substring(path.lastIndexOf('/') + 1);

            RoleRepresentation realmRole = keycloak.realm(realmName).roles().get(roleName).toRepresentation();
            usersResource.get(keycloakUserId).roles().realmLevel().add(Collections.singletonList(realmRole));

            return keycloakUserId;
        }
    }

    public void deleteUserInKeycloak(String keycloakId) {
        try {
            keycloak.realm("your-realm-name")
                    .users()
                    .get(keycloakId)
                    .remove();
        } catch (Exception e) {
            throw new RuntimeException("Error deleting user from Keycloak: " + e.getMessage());
        }
    }
}