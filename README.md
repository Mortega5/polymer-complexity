# POLYMER COMPLEXITY

Web component complexity and maintenance evaluation tool. It uses [plato](https://github.com/es-analysis/plato)

## USAGE

```
  Usage: wcc [options] <component>

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -o --output <output>           Directory of output will be stored
    -r --recursive                 Enable recursive analyze
    -d --delete                    Remove output folder if exist
    -c --config <config></config>  Config file
    --nomixpanel                   Avoid to send data to mixpanel

```

## Config file options

| Param       | Description                                                                                     | Default |   |   |
|-------------|-------------------------------------------------------------------------------------------------|---------|---|---|
| Components  | List of components to be checked                                                                |         |   |   |
| base_folder | Root directory where components are read                                                        |         |   |   |
| mixpanel    | Object with tokens to publish in mixpanel. One token for maintainability and one for complexity |         |   |   |

### Example of config file

```
{
  "components": [
    "facebook-wall-maintenance/facebook-wall.html"
  ],

  "base_folder": "bower_components",
  "mixpanel": {
    "maintainability": "9879asd767asdasd",
    "complexity": "543wsfa2344edfds"
  }
}
```
