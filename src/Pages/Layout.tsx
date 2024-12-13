import { NavLink, Outlet } from "react-router";
import {
    Button,
    Container,
    Dropdown,
    Grid,
    Icon,
    Menu,
  } from "semantic-ui-react";
import { useState } from "react";

// Examples for layouts https://semantic-ui-forest.com/templates
// Semantic UI React https://react.semantic-ui.com/
// UI Links: https://stackoverflow.com/questions/74573972/implementing-links-in-a-semantic-ui-menu
function Layout() {
    const [dropdownMenuStyle, setDropdownMenuStyle] = useState<any>(
        {
            display: "none"
        });

    function handleToggleDropdownMenu() {
        if (dropdownMenuStyle.display === "none") {
            setDropdownMenuStyle({ display: "flex" });
        } else {
            setDropdownMenuStyle({ display: "none" });
        }
    };

    return (
      <div className="App">
        <Grid padded className="tablet computer only">
          <Menu borderless fluid fixed="top" size="huge">
            <Container>
              <Menu.Item header as="a">
              <img src="images/chat3dlogo.png"/>&nbsp;<p>Chat3D</p>
              </Menu.Item>
              <Menu.Item as="a">
                <NavLink to="/" end>Home</NavLink>
              </Menu.Item>
              <Menu.Item as="a">
                <NavLink to="/chat" end>Chat</NavLink>
              </Menu.Item>
              <Menu.Item as="a">Contact</Menu.Item>
              <Dropdown item text="Dropdown">
                <Dropdown.Menu>
                  <Dropdown.Item as="a" href="#root">
                    Action
                  </Dropdown.Item>
                  <Dropdown.Item as="a" href="#root">
                    Another Action
                  </Dropdown.Item>
                  <Dropdown.Item as="a" href="#root">
                    Something else here
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Header>Navbar header</Dropdown.Header>
                  <Dropdown.Item as="a" href="#root">
                    Separated link
                  </Dropdown.Item>
                  <Dropdown.Item as="a" href="#root">
                    One more separated link
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Menu.Menu position="right">
                <Menu.Item as="a">Default</Menu.Item>
                <Menu.Item as="a">Static top</Menu.Item>
                <Menu.Item active as="a">
                  Fixed top
                </Menu.Item>
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
              <Menu.Item active as="a">
                Home
              </Menu.Item>
              <Menu.Item as="a">About</Menu.Item>
              <Menu.Item as="a">Contact</Menu.Item>
              <Dropdown text="Dropdown" className="item">
                <Dropdown.Menu>
                  <Dropdown.Item as="a">Action</Dropdown.Item>
                  <Dropdown.Item as="a">Another action</Dropdown.Item>
                  <Dropdown.Item as="a">Something else here</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Header>Navbar header</Dropdown.Header>
                  <Dropdown.Item as="a">Seperated link</Dropdown.Item>
                  <Dropdown.Item as="a">One more seperated link</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Menu.Item as="a">Default</Menu.Item>
              <Menu.Item as="a">Static top</Menu.Item>
              <Menu.Item active as="a">
                Fixed top
              </Menu.Item>
            </Menu>
          </Menu>
        </Grid>
        <Container className="content-body">
            <Outlet />
        </Container>
      </div>
    );
}

export default Layout;