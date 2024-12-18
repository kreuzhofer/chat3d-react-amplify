import { NavLink, Outlet } from "react-router";
import {
    Button,
    Container,
    Grid,
    Icon,
    Menu,
  } from "semantic-ui-react";
import { SetStateAction, useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';

// Examples for layouts https://semantic-ui-forest.com/templates
// Semantic UI React https://react.semantic-ui.com/
// UI Links: https://stackoverflow.com/questions/74573972/implementing-links-in-a-semantic-ui-menu
function Layout() {
    const [dropdownMenuStyle, setDropdownMenuStyle] = useState<any>(
        {
            display: "none"
        });

    const { signOut } = useAuthenticator();


    function handleToggleDropdownMenu() {
        if (dropdownMenuStyle.display === "none") {
            setDropdownMenuStyle({ display: "flex" });
        } else {
            setDropdownMenuStyle({ display: "none" });
        }
    };

    const [activeItem, setActiveItem] = useState("home");
    const setActiveItemOnClick = (name: SetStateAction<string>) => {
  
        setActiveItem(name);
    };

    return (
      <div className="App">
        <Grid padded className="tablet computer only">
          <Menu borderless fluid fixed="top" size="huge">
            <Container>
              <Menu.Item header as="a">
              <img src="images/chat3dlogo.png"/>&nbsp;<p>Chat3D</p>
              </Menu.Item>
              <Menu.Item as={NavLink}
                to="/" 
                name="home" 
                active={activeItem === "home"}
                onClick={()=>setActiveItemOnClick("home")}
                >
                Home
              </Menu.Item>
              <Menu.Item as={NavLink}
                to="/chat"
                name="chat"
                active={activeItem === "chat"}
                onClick={()=>setActiveItemOnClick("chat")}
                >
                Chat
              </Menu.Item>
              <Menu.Menu position="right">
                <Menu.Item onClick={signOut}>Logout</Menu.Item>
              </Menu.Menu>
            </Container>
          </Menu>
        </Grid>
        <Grid padded className="mobile only">
          <Menu borderless fluid fixed="top" size="huge">
            <Menu.Item header as="a">
              <img src="images/chat3dlogo.png"/>&nbsp;<p>Chat3D</p>
            </Menu.Item>
            <Menu.Menu position="right">
              <Menu.Item>
                <Button
                  icon
                  basic
                  toggle
                  onClick={handleToggleDropdownMenu}
                >
                  <Icon name="content" />
                </Button>
              </Menu.Item>
            </Menu.Menu>
            <Menu
              vertical
              borderless
              fluid
              style={dropdownMenuStyle}
            >
              <Menu.Item as={NavLink}
                to="/" 
                name="home" 
                active={activeItem === "home"}
                onClick={()=>setActiveItemOnClick("home")}
                >
                Home
              </Menu.Item>
              <Menu.Item as={NavLink}
                to="/chat"
                name="chat"
                active={activeItem === "chat"}
                onClick={()=>setActiveItemOnClick("chat")}
                >
                Chat
              </Menu.Item>
              <Menu.Item onClick={signOut}>Logout</Menu.Item>
            </Menu>
          </Menu>
        </Grid>
        <main>
          <Container>
              <Outlet />
          </Container>
        </main>
        <footer>
          <Container>
            <p>Place sticky footer content here.</p>
          </Container>
        </footer>
      </div>
    );
}

export default Layout;