with import <nixpkgs> {};

mkShell {
  name = "python-devel";
  venvDir = "venv";

  nativeBuildInputs = [ chromedriver ];
 
  buildInputs = with python3Packages; [ 
    notebook
    titlecase
    selenium
    bibtexparser
  ];
}
