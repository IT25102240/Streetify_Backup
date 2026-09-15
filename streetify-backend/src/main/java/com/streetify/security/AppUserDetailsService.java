package com.streetify.security;

import com.streetify.dao.UserDAO;
import com.streetify.entity.User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * AppUserDetailsService — Bridges Spring Security with the Streetify User database.
 *
 * Spring Security calls loadUserByUsername() during authentication.
 * We load the User entity from MSSQL via UserDAO and wrap it
 * into a Spring Security UserDetails object.
 */
@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserDAO userDAO;

    public AppUserDetailsService(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    /**
     * Loads a user by their email address (used as the unique login identifier).
     *
     * @param email the user's email
     * @return Spring Security UserDetails
     * @throws UsernameNotFoundException if no user exists with that email
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userDAO.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("No Streetify user found with email: " + email)
                );

        // Map the Streetify role enum to a Spring Security GrantedAuthority
        // Format: "ROLE_PASSENGER", "ROLE_DRIVER", "ROLE_STAFF", "ROLE_ADMIN"
        SimpleGrantedAuthority authority =
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                user.isActive(),              // enabled
                true,                         // accountNonExpired
                true,                         // credentialsNonExpired
                !user.isSuspended(),          // accountNonLocked
                List.of(authority)
        );
    }
}
