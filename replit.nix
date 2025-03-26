
{ pkgs }: {
    deps = [
      pkgs.nodejs-slim
      pkgs.nodejs
      pkgs.postgresql
        pkgs.nodejs-20_x
        pkgs.nodePackages.typescript
    ];
}
